import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema({
    type: { type: String, unique: true, default: 'printing_rules' },
    rules: {
        printing: {
            bw: {
                single: { type: Number, default: 0.75 },
                double: { type: Number, default: 0.5 },
                a3_single: { type: Number, default: 2 },
                a3_double: { type: Number, default: 1.5 }
            },
            color: {
                single: { type: Number, default: 8 },
                double: { type: Number, default: 8 },
                a3_single: { type: Number, default: 20 },
                a3_double: { type: Number, default: 20 }
            }
        },
        additional: {
            binding: { type: Number, default: 15 },
            hard_binding: { type: Number, default: 200 },
            chart_binding: { type: Number, default: 10 },
            handling_fee: { type: Number, default: 10 }
        },
        delivery_tiers: {
            tier_a: {
                maxWeight: { type: Number, default: 3 },
                rate: { type: Number, default: 35 },
                slip: { type: Number, default: 0 }
            },
            tier_b: {
                maxWeight: { type: Number, default: 10 },
                rate: { type: Number, default: 29 },
                slip: { type: Number, default: 20 }
            },
            tier_c: {
                maxWeight: { type: Number, default: 999 },
                rate: { type: Number, default: 26 },
                slip: { type: Number, default: 20 }
            }
        }
    }
}, { timestamps: true });

const Pricing = mongoose.models.pricing || mongoose.model('pricing', pricingSchema);

export default Pricing;
