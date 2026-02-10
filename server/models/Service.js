import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: { type: String },
    description: { type: String },
    price: { type: Number },
    priceRange: { type: String },
    category: { type: String, enum: ['Printing', 'Binding', 'Lamination', 'ID Card', 'Other'], default: 'Printing' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    whatsappEnquiryLink: { type: String }
}, { timestamps: true });

const Service = mongoose.models.service || mongoose.model('service', serviceSchema);

export default Service;
