import mongoose from 'mongoose';
import 'dotenv/config';
import Pricing from './models/Pricing.js';
import User from './models/User.js';
import Service from './models/Service.js';
import connectDB from './configs/db.js';

const seedDB = async () => {
    try {
        await connectDB();

        // 1. Initial Pricing Rules
        const existingPricing = await Pricing.findOne({ type: 'printing_rules' });
        const defaultRules = {
            printing: {
                bw: { single: 0.75, double: 0.5, a3_single: 2, a3_double: 1.5 },
                color: { single: 8, double: 8, a3_single: 20, a3_double: 20 }
            },
            additional: {
                binding: 15,
                hard_binding: 200,
                chart_binding: 10,
                handling_fee: 10
            },
            delivery_tiers: {
                tier_a: { maxWeight: 3, rate: 35, slip: 0 },
                tier_b: { maxWeight: 10, rate: 29, slip: 20 },
                tier_c: { maxWeight: 999, rate: 26, slip: 20 }
            }
        };

        if (!existingPricing) {
            await Pricing.create({ type: 'printing_rules', rules: defaultRules });
            console.log('✅ Default pricing rules created');
        } else {
            await Pricing.findOneAndUpdate({ type: 'printing_rules' }, { rules: defaultRules });
            console.log('✅ Pricing rules updated to latest');
        }

        // 2. Standard Services Initialization
        const standardServices = [
            { name: 'B/W Printing', icon: '📄', description: 'Budget-friendly monochrome printing.', price: 0.75, priceSingleSide: 0.75, priceDoubleSide: 0.5, category: 'Printing' },
            { name: 'Color Printing', icon: '🌈', description: 'Vibrant full-color documents.', price: 8, priceSingleSide: 8, priceDoubleSide: 8, category: 'Printing' },
            { name: 'A3 B/W Printing', icon: '🖨️', description: 'Large format monochrome prints.', price: 2, priceSingleSide: 2, priceDoubleSide: 1.5, category: 'Printing' },
            { name: 'A3 Color Printing', icon: '🖼️', description: 'Large format vibrant color prints.', price: 20, priceSingleSide: 20, priceDoubleSide: 20, category: 'Printing' },
            { name: 'Spiral Binding', icon: '📚', description: 'Professional spiral binding.', price: 15, category: 'Binding' },
            { name: 'Chart Binding', icon: '📊', description: 'Specialized chart binding.', price: 10, category: 'Binding' }
        ];

        for (const s of standardServices) {
            await Service.findOneAndUpdate({ name: s.name }, s, { upsert: true });
        }
        console.log('✅ Standard services synchronized');

        // 3. Sample Admin/User if needed
        const existingUser = await User.findOne({ phone: '9876543210' });
        if (!existingUser) {
            await User.create({
                name: 'Test Customer',
                email: 'test@example.com',
                phone: '9876543210',
                walletBalance: 100
            });
            console.log('✅ Test user created');
        }

        console.log('🚀 Seeding completed successfully');
        process.exit();
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

seedDB();
