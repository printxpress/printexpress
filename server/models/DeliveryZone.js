import mongoose from "mongoose";

const deliveryZoneSchema = new mongoose.Schema({
    pincode: { type: String, required: true, unique: true },
    district: { type: String },
    state: { type: String },
    isAvailable: { type: Boolean, default: true },
    deliveryCharge: { type: Number, default: 40 },
    estimatedDays: { type: String, default: '2-3 Days' }
}, { timestamps: true });

const DeliveryZone = mongoose.models.deliveryzone || mongoose.model('deliveryzone', deliveryZoneSchema);

export default DeliveryZone;
