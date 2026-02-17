import Order from '../models/Order.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import Pricing from '../models/Pricing.js';
import Service from '../models/Service.js';
import Coupon from '../models/Coupon.js';
// ... existing imports ...
import { v2 as cloudinary } from 'cloudinary';
import PDFDocument from 'pdfkit';


// Helper for Custom Page Counting
const calculateCustomPageCount = (range) => {
    if (!range) return 0;
    const parts = range.split(',').map(p => p.trim());
    let count = 0;
    parts.forEach(part => {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end) && end >= start) {
                count += (end - start + 1);
            }
        } else {
            const num = Number(part);
            if (!isNaN(num) && num > 0) count += 1;
        }
    });
    return count;
};

// Place Print Order : /api/order/print
export const placePrintOrder = async (req, res) => {
    try {
        const { printOptions, fulfillment, deliveryDetails, paymentMethod, couponCode, couponDiscount, walletUsed, fileMetadata } = JSON.parse(req.body.data);
        const userId = req.userId;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.json({ success: false, message: "No files uploaded" });
        }

        // 1. Upload files to Cloudinary
        const uploadedFiles = await Promise.all(
            files.map(async (file, index) => {
                const result = await cloudinary.uploader.upload(file.path, { resource_type: 'auto', folder: 'print_orders' });
                // Use metadata from frontend if available, else default to 1
                const meta = fileMetadata ? fileMetadata.find(m => m.name === file.originalname) : null;
                return {
                    url: result.secure_url,
                    originalName: file.originalname,
                    fileType: file.mimetype,
                    pageCount: meta ? meta.pageCount : 1
                };
            })
        );

        // 2. Fetch Pricing Rules and Services
        const [pricingData, services] = await Promise.all([
            Pricing.findOne({ type: 'printing_rules' }),
            Service.find({})
        ]);

        const rules = pricingData ? pricingData.rules : {
            printing: { bw: { single: 2, double: 3 }, color: { single: 10, double: 15 } },
            additional: { binding: 50, hard_binding: 200, handling_fee: 10 },
            delivery_tiers: {
                tier_a: { maxWeight: 3, rate: 35, slip: 0 },
                tier_b: { maxWeight: 10, rate: 29, slip: 20 },
                tier_c: { maxWeight: 999, rate: 26, slip: 20 }
            }
        };

        // 3. Calculate Pricing (Server-side validation)
        const docPages = uploadedFiles.reduce((acc, f) => acc + f.pageCount, 0);
        const totalPages = printOptions.pageRangeType === 'Custom'
            ? calculateCustomPageCount(printOptions.customPages)
            : docPages;

        const isColor = printOptions.mode === 'Color';
        const isDouble = printOptions.side === 'Double';
        const isA3 = printOptions.paperSize === 'A3';

        // Dynamic Pricing Integration (Backend)
        const serviceName = isColor ? "Color A4 Print" : "B/W A4 Print";
        const matchingService = services.find(s => s.name === serviceName);

        let rate;
        const colorKey = isColor ? 'color' : 'bw';
        const sideKey = isDouble ? 'double' : 'single';
        const a3SideKey = isDouble ? 'a3_double' : 'a3_single';

        if (matchingService) {
            rate = Number(matchingService.price);
            if (isDouble) {
                const multiplier = (rules.printing[colorKey].double / rules.printing[colorKey].single) || 1;
                rate *= multiplier;
            }
            if (isA3) rate *= 2;
        } else {
            if (isA3) {
                rate = rules.printing[colorKey][a3SideKey] || (rules.printing[colorKey][sideKey] * 2);
            } else {
                rate = rules.printing[colorKey][sideKey];
            }
        }

        // Apply Pages per Sheet Logic (Backend Sync)
        const effectivePages = printOptions.pagesPerSheet === 2 ? Math.ceil(totalPages / 2) : totalPages;

        const printingCharge = effectivePages * (rate || (isColor ? 10 : 2)) * (printOptions.copies || 1);
        const billingSheets = isDouble ? Math.ceil(effectivePages / 2) : effectivePages;

        let bindingCharge = 0;
        let bindingWeight = 0;
        if (printOptions.binding === 'Spiral') {
            bindingCharge = (rules.additional.binding || 15) * (printOptions.bindingQuantity || 1);
            bindingWeight = 0.1 * (printOptions.bindingQuantity || 1);
        } else if (printOptions.binding === 'Chart') {
            bindingCharge = (rules.additional.chart_binding || 10) * (printOptions.bindingQuantity || 1);
            bindingWeight = 0.05 * (printOptions.bindingQuantity || 1);
        }

        const totalSheets = billingSheets * (printOptions.copies || 1);

        // Weight Calculation: 1 kg per 200 sheets (rounded up)
        const calcWeight = Math.ceil(totalSheets / 200) + Math.ceil(bindingWeight);

        let deliveryCharge = 0;
        if (fulfillment.method === 'delivery') {
            if (calcWeight <= 3) {
                // Tier 1: <= 3kg -> ₹35 per kg, No Slip
                deliveryCharge = 35 * calcWeight;
            } else if (calcWeight <= 10) {
                // Tier 2: 4-10kg -> ₹29 per kg + ₹20 Slip
                deliveryCharge = (29 * calcWeight) + 20;
            } else {
                // Tier 3: > 10kg -> ₹26 per kg + ₹20 Slip
                deliveryCharge = (26 * calcWeight) + 20;
            }
        }

        // Final Total calculated server-side to prevent tampering
        const subtotal = printingCharge + bindingCharge + deliveryCharge;
        let finalAmount = Math.max(0, subtotal - (couponDiscount || 0) - (walletUsed || 0));

        // NaN Safeguards
        if (isNaN(printingCharge)) throw new Error("Invalid printing charge calculation");
        if (isNaN(deliveryCharge)) deliveryCharge = 0;
        if (isNaN(finalAmount)) finalAmount = 0;

        // 4. Handle Wallet Deduction
        if (walletUsed > 0) {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet || wallet.balance < walletUsed) {
                return res.json({ success: false, message: "Insufficient wallet balance" });
            }
            wallet.balance -= walletUsed;
            wallet.transactions.push({
                type: 'debit',
                amount: walletUsed,
                description: `Used for order #${String(userId).slice(-6)}`,
                addedBy: 'user'
            });
            await wallet.save();
            await User.findByIdAndUpdate(userId, { walletBalance: wallet.balance });
        }

        // 5. Handle Coupon Usage
        if (couponCode) {
            await Coupon.findOneAndUpdate({ code: couponCode }, { $inc: { usedCount: 1 } });
        }

        // 6. Create Order
        const order = await Order.create({
            userId,
            files: uploadedFiles,
            printOptions,
            pricing: {
                printingCharge,
                bindingCharge,
                deliveryCharge,
                couponDiscount: couponDiscount || 0,
                walletUsed: walletUsed || 0,
                totalAmount: finalAmount
            },
            fulfillment,
            deliveryDetails: fulfillment.method === 'pickup' ? { phone: deliveryDetails?.phone || '', address: 'PICKUP' } : deliveryDetails,
            payment: {
                method: paymentMethod,
                isPaid: (paymentMethod === 'Wallet' && finalAmount === 0) || (paymentMethod === 'UPI+Wallet' && finalAmount === 0)
            },
            couponCode: couponCode || '',
            status: 'received'
        });

        return res.json({ success: true, message: "Order Placed Successfully", orderId: order._id });

    } catch (error) {
        console.log("--- ERROR PLACING ORDER ---");
        console.log("Request Body Data:", req.body.data);
        console.log("Raw Error Object:", error);
        console.log("Error Message:", error?.message);
        console.log("Error Stack:", error?.stack);

        // Return a more descriptive error if possible
        return res.json({ success: false, message: error.message || "Failed to place order" });
    }
}

// Get Orders by User ID : /api/order/user
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.userId;
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Place POS Order (No files) : /api/order/pos
export const createPosOrder = async (req, res) => {
    try {
        const { customer, items, totalAmount, paymentMethod } = req.body;

        // POS orders are immediately 'ready' or 'delivered'
        const order = await Order.create({
            userId: req.body.userId || undefined, // Use undefined for guest/direct sales
            printOptions: { mode: 'B/W', side: 'Single', binding: 'None' }, // Default for POS items
            pricing: {
                totalAmount,
                printingCharge: totalAmount, // Flat allocation for POS
                deliveryCharge: 0
            },
            deliveryDetails: {
                phone: customer.phone,
                address: 'POS Counter'
            },
            payment: {
                method: paymentMethod || 'Cash',
                isPaid: true
            },
            status: 'delivered',
            fulfillment: { method: 'pickup' },
            files: items.map(item => ({
                originalName: item.name,
                url: '',
                fileType: 'POS Service'
            }))
        });

        res.json({ success: true, message: "POS Order Created", orderId: order._id });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Cleanup Files older than 7 Days (Admin) : /api/order/cleanup
export const cleanupOldFiles = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Find orders older than 7 days that still have file URLs
        const orders = await Order.find({
            createdAt: { $lt: sevenDaysAgo },
            'files.url': { $ne: '' }
        });

        let deletedCount = 0;

        for (const order of orders) {
            for (const file of order.files) {
                if (file.url) {
                    // Extract public_id from Cloudinary URL
                    // Example: https://res.cloudinary.com/demo/image/upload/v12345/folder/name.pdf
                    const parts = file.url.split('/');
                    const filenameWithExt = parts[parts.length - 1];
                    const filename = filenameWithExt.split('.')[0];
                    const folder = parts[parts.length - 2];
                    const publicId = `${folder}/${filename}`;

                    try {
                        await cloudinary.uploader.destroy(publicId);
                    } catch (err) {
                        console.error(`Failed to delete file ${publicId}:`, err.message);
                    }
                }
            }

            // Clear URLs in DB but keep the names and other metadata
            const updatedFiles = order.files.map(f => ({ ...f, url: '' }));
            await Order.findByIdAndUpdate(order._id, { files: updatedFiles });
            deletedCount++;
        }

        res.json({ success: true, message: `Cleanup complete. Processed ${deletedCount} orders.` });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Get All Orders (Admin) : /api/order/all
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 }).populate('userId', 'name phone');
        res.json({ success: true, orders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Update Order and Recalculate Amount (Admin) : /api/order/edit/:orderId
export const updateOrderAndRecalculate = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { printOptions } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.json({ success: false, message: "Order not found" });

        // Fetch Pricing Rules
        const pricingData = await Pricing.findOne({ type: 'printing_rules' });
        const rules = pricingData ? pricingData.rules : {
            printing: { bw: { single: 2, double: 3 }, color: { single: 10, double: 15 } },
            additional: { binding: 50, hard_binding: 200, handling_fee: 10 },
            delivery_tiers: {
                tier_a: { maxWeight: 3, rate: 35, slip: 0 },
                tier_b: { maxWeight: 10, rate: 29, slip: 20 },
                tier_c: { maxWeight: 999, rate: 26, slip: 20 }
            }
        };

        // Recalculate
        const docPages = order.files.reduce((acc, f) => acc + (f.pageCount || 0), 0);
        const totalPages = printOptions.pageRangeType === 'Custom'
            ? calculateCustomPageCount(printOptions.customPages)
            : docPages;

        const isColor = printOptions.mode === 'Color';
        const isDouble = printOptions.side === 'Double';

        const colorKey = isColor ? 'color' : 'bw';
        const sideKey = isDouble ? 'double' : 'single';
        const a3SideKey = isDouble ? 'a3_double' : 'a3_single';

        let rate;
        if (isA3) {
            rate = rules.printing[colorKey][a3SideKey] || (rules.printing[colorKey][sideKey] * 2);
        } else {
            rate = rules.printing[colorKey][sideKey];
        }

        const printingCharge = totalPages * (rate || (isColor ? 10 : 2)) * (printOptions.copies || 1);
        const billingSheets = isDouble ? Math.ceil(totalPages / 2) : totalPages;

        let bindingCharge = 0;
        let bindingWeight = 0;
        if (printOptions.binding === 'Spiral') {
            bindingCharge = (rules.additional.binding || 15) * (printOptions.bindingQuantity || 1);
            bindingWeight = 0.1 * (printOptions.bindingQuantity || 1);
        } else if (printOptions.binding === 'Chart') {
            bindingCharge = (rules.additional.chart_binding || 10) * (printOptions.bindingQuantity || 1);
            bindingWeight = 0.05 * (printOptions.bindingQuantity || 1);
        }

        const totalSheets = billingSheets * (printOptions.copies || 1);
        const calcWeight = (totalSheets * 5 / 1000) + bindingWeight;

        let deliveryCharge = 0;
        if (order.fulfillment.method === 'delivery') {
            const tiers = rules.delivery_tiers;
            let rule = tiers.tier_c;

            if (calcWeight <= tiers.tier_a.maxWeight) {
                rule = tiers.tier_a;
            } else if (calcWeight <= tiers.tier_b.maxWeight) {
                rule = tiers.tier_b;
            }

            deliveryCharge = (rule.rate * calcWeight) + rule.slip;
        }

        const subtotal = printingCharge + bindingCharge + deliveryCharge;
        const finalAmount = Math.max(0, subtotal - (order.pricing.couponDiscount || 0) - (order.pricing.walletUsed || 0));

        order.printOptions = { ...order.printOptions, ...printOptions };
        order.pricing = {
            ...order.pricing,
            printingCharge,
            bindingCharge,
            totalAmount: finalAmount
        };
        order.payment.isPaid = false; // Reset payment status on modification if amount changes

        await order.save();

        res.json({ success: true, message: "Order updated and recalculated", order });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Generate Stripe Payment Link for Order Payment : /api/order/payment-link/:orderId


// Generate Thermal Bill PDF : /api/order/thermal-bill/:orderId
export const generateThermalBillPDF = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId).populate('userId');
        if (!order) return res.json({ success: false, message: "Order not found" });

        const doc = new PDFDocument({ size: [226, 600], margins: { top: 10, left: 10, right: 10, bottom: 10 } }); // 80mm wide (approx 226pt)

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bill_${orderId}.pdf`);

        doc.pipe(res);

        // Content
        doc.fontSize(12).text('PRINT EXPRESS', { align: 'center' });
        doc.fontSize(8).text('Your One-Stop Print Shop', { align: 'center' });
        doc.moveDown();
        doc.text('-----------------------------------', { align: 'center' });
        doc.text(`Order ID: #${order._id.toString().slice(-8)}`);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
        doc.text(`Customer: ${order.userId?.name || 'Walk-in'}`);
        doc.text(`Phone: ${order.deliveryDetails?.phone || 'N/A'}`);
        doc.text('-----------------------------------');
        doc.moveDown();

        doc.text('Items:', { underline: true });
        order.files.forEach(file => {
            doc.text(`${file.originalName.slice(0, 20)}... x ${order.printOptions.copies}`);
        });
        doc.moveDown();

        doc.text(`Mode: ${order.printOptions.mode}`);
        doc.text(`Side: ${order.printOptions.side}`);
        doc.text(`Binding: ${order.printOptions.binding}`);
        doc.moveDown();

        doc.text('-----------------------------------');
        doc.text(`Subtotal: ₹${(order.pricing.printingCharge + order.pricing.bindingCharge).toFixed(2)}`);
        doc.text(`Delivery: ₹${order.pricing.deliveryCharge.toFixed(2)}`);
        if (order.pricing.couponDiscount > 0) doc.text(`Discount: -₹${order.pricing.couponDiscount.toFixed(2)}`);
        if (order.pricing.walletUsed > 0) doc.text(`Wallet: -₹${order.pricing.walletUsed.toFixed(2)}`);
        doc.fontSize(10).text(`TOTAL: ₹${order.pricing.totalAmount.toFixed(2)}`, { bold: true });
        doc.text('-----------------------------------');
        doc.moveDown();
        doc.fontSize(8).text('Thank you for your business!', { align: 'center' });

        doc.end();
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Update Order Status (Admin) : /api/order/update-status
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true }).populate('userId');

        // Trigger WhatsApp notification logic
        if (order && order.userId && order.userId.phone) {
            console.log(`[WhatsApp Notification] To: ${order.userId.phone}, Message: Your order #${order._id.toString().slice(-8)} is now ${status}.`);
            // TODO: In production, call WhatsApp Cloud API here
        }

        res.json({ success: true, order });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Stripe Webhooks Handler : /api/order/webhook

