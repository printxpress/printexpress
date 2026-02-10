import Order from "../models/Order.js";
import User from "../models/User.js";
import Pricing from "../models/Pricing.js";
import Wallet from "../models/Wallet.js";
import Coupon from "../models/Coupon.js";
import { v2 as cloudinary } from "cloudinary";
import stripe from "stripe";

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

        // 2. Fetch Pricing Rules (for server-side validation/reference)
        const pricingData = await Pricing.findOne({ type: 'printing_rules' });
        const rules = pricingData ? pricingData.rules : {
            printing: { bw: { single: 2, double: 3 }, color: { single: 10, double: 15 } },
            additional: { binding: 50, hard_binding: 200, handling_fee: 10 }
        };

        // 3. Calculate Pricing (Server-side validation)
        let printingCharge = 0;
        let bindingCharge = 0;
        let totalPages = uploadedFiles.reduce((acc, f) => acc + f.pageCount, 0);

        const isColor = printOptions.mode === 'Color';
        const isDouble = printOptions.side === 'Double';

        const rate = isColor
            ? (isDouble ? rules.printing.color.double : rules.printing.color.single)
            : (isDouble ? rules.printing.bw.double : rules.printing.bw.single);

        printingCharge = totalPages * (rate || (isColor ? 10 : 2)) * (printOptions.copies || 1);

        if (printOptions.binding === 'Spiral') bindingCharge = rules.additional.binding || 50;
        if (printOptions.binding === 'Staple') bindingCharge = 10; // Staple is usually cheap/fixed
        if (printOptions.binding === 'Hard') bindingCharge = rules.additional.hard_binding || 200;

        const deliveryCharge = fulfillment.method === 'pickup' ? 0 : 40; // Fixed delivery for now or from shop settings

        // Final Total calculated server-side to prevent tampering
        const subtotal = printingCharge + bindingCharge + deliveryCharge;
        const finalAmount = Math.max(0, subtotal - (couponDiscount || 0) - (walletUsed || 0));

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
                description: `Used for order #${userId.slice(-6)}`,
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
        console.log(error.message);
        return res.json({ success: false, message: error.message });
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

// Update Order Status (Admin) : /api/order/update-status
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true }).populate('userId');

        // Trigger WhatsApp notification logic
        if (order && order.userId && order.userId.phone) {
            console.log(`[WhatsApp Notification] To: ${order.userId.phone}, Message: Your order #${order._id.slice(-8)} is now ${status}.`);
            // TODO: In production, call WhatsApp Cloud API here
        }

        res.json({ success: true, order });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Stripe Webhooks Placeholder
export const stripeWebhooks = async (req, res) => {
    res.json({ received: true });
}
