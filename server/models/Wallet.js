import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'order' },
    addedBy: { type: String, enum: ['system', 'admin', 'referral', 'order', 'user'], default: 'system' },
}, { timestamps: true });

const walletSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    transactions: [transactionSchema]
}, { timestamps: true });

const Wallet = mongoose.models.wallet || mongoose.model('wallet', walletSchema);

export default Wallet;
