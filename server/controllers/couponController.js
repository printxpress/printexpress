import Coupon from '../models/Coupon.js';

// Admin: Create coupon : POST /api/coupon/create
export const createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, minOrder, maxDiscount, usageLimit, validTill, description } = req.body;
        if (!code || !discountType || !discountValue || !validTill) {
            return res.json({ success: false, message: 'Missing required fields' });
        }
        const exists = await Coupon.findOne({ code: code.toUpperCase() });
        if (exists) return res.json({ success: false, message: 'Coupon code already exists' });

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minOrder: minOrder || 0,
            maxDiscount: maxDiscount || 500,
            usageLimit: usageLimit || 100,
            validTill: new Date(validTill),
            description
        });
        return res.json({ success: true, coupon });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Admin: Get all coupons : GET /api/coupon/all
export const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        return res.json({ success: true, coupons });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Customer: Validate coupon : POST /api/coupon/validate
export const validateCoupon = async (req, res) => {
    try {
        const { code, orderAmount } = req.body;
        if (!code) return res.json({ success: false, message: 'Enter a coupon code' });

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
        if (!coupon) return res.json({ success: false, message: 'Invalid coupon code' });

        // Check validity dates
        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validTill) {
            return res.json({ success: false, message: 'Coupon has expired' });
        }

        // Check usage
        if (coupon.usedCount >= coupon.usageLimit) {
            return res.json({ success: false, message: 'Coupon usage limit reached' });
        }

        // Check min order
        if (orderAmount < coupon.minOrder) {
            return res.json({ success: false, message: `Minimum order ₹${coupon.minOrder} required` });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = Math.min((orderAmount * coupon.discountValue) / 100, coupon.maxDiscount);
        } else {
            discount = Math.min(coupon.discountValue, orderAmount);
        }

        return res.json({
            success: true,
            coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, description: coupon.description },
            discount: Math.round(discount)
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Admin: Toggle coupon : POST /api/coupon/toggle
export const toggleCoupon = async (req, res) => {
    try {
        const { id } = req.body;
        const coupon = await Coupon.findById(id);
        if (!coupon) return res.json({ success: false, message: 'Coupon not found' });

        coupon.isActive = !coupon.isActive;
        await coupon.save();
        return res.json({ success: true, message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}` });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Admin: Delete coupon : POST /api/coupon/delete
export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.body;
        await Coupon.findByIdAndDelete(id);
        return res.json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
