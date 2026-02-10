import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'flat'], required: true },
    discountValue: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 500 },
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, default: Date.now },
    validTill: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    description: { type: String }
}, { timestamps: true });

const Coupon = mongoose.models.coupon || mongoose.model('coupon', couponSchema);

export default Coupon;
