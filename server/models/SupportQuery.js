import mongoose from "mongoose";

const supportQuerySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
    adminNote: { type: String, default: '' }
}, { timestamps: true });

const SupportQuery = mongoose.models.supportQuery || mongoose.model('supportQuery', supportQuerySchema);

export default SupportQuery;
