import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    address: {
        line1: String,
        pincode: String,
        district: String,
        state: String,
        landmark: String
    },
    walletBalance: { type: Number, default: 0, min: 0 },
    cart: { type: Object, default: {} },
    lastLogin: Date
}, { timestamps: true, minimize: false });

const User = mongoose.models.user || mongoose.model('user', userSchema);

export default User;