import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema({
    type: { type: String, unique: true, default: 'printing_rules' },
    rules: {
        printing: {
            bw: {
                single: { type: Number, default: 2 },
                double: { type: Number, default: 3 }
            },
            color: {
                single: { type: Number, default: 10 },
                double: { type: Number, default: 15 }
            }
        },
        additional: {
            binding: { type: Number, default: 50 },
            hard_binding: { type: Number, default: 200 },
            handling_fee: { type: Number, default: 10 }
        }
    }
}, { timestamps: true });

const Pricing = mongoose.models.pricing || mongoose.model('pricing', pricingSchema);

export default Pricing;
