import Pricing from "../models/Pricing.js";
import mongoose from "mongoose";

// Get Pricing Rules : /api/pricing
export const getPricing = async (req, res) => {
    try {
        let pricing = await Pricing.findOne({ type: 'printing_rules' });
        if (!pricing) {
            pricing = await Pricing.create({
                type: 'printing_rules',
                rules: {
                    printing: {
                        bw: { single: 0.75, double: 0.5, a3_single: 2, a3_double: 1.5 },
                        color: { single: 8, double: 8, a3_single: 20, a3_double: 20 }
                    },
                    additional: {
                        binding: 15,
                        hard_binding: 200,
                        chart_binding: 10,
                        staple_binding: 0.30,
                        handling_fee: 10
                    },
                    delivery_tiers: {
                        tier_a: { maxWeight: 3, rate: 35, slip: 0 },
                        tier_b: { maxWeight: 10, rate: 29, slip: 20 },
                        tier_c: { maxWeight: 999, rate: 26, slip: 20 }
                    }
                }
            });
        }
        res.json({ success: true, pricing });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Update Pricing Rules (Admin) : /api/pricing/update
export const updatePricing = async (req, res) => {
    try {
        const { printing, additional, delivery_tiers } = req.body;
        const pricing = await Pricing.findOneAndUpdate(
            { type: 'printing_rules' },
            { rules: { printing, additional, delivery_tiers } },
            { new: true, upsert: true }
        );
        res.json({ success: true, pricing });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}
