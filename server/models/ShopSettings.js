import mongoose from "mongoose";

const shopSettingsSchema = new mongoose.Schema({
    name: { type: String, default: "Print Express" },
    address: { type: String, default: "Print Express Store, Coimbatore" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    deliveryBaseCharge: { type: Number, default: 40 }
}, { timestamps: true });

const ShopSettings = mongoose.models.shopSettings || mongoose.model('shopSettings', shopSettingsSchema);

export default ShopSettings;
