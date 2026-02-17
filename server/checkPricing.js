
import mongoose from 'mongoose';
import 'dotenv/config';
import Pricing from './models/Pricing.js';

async function checkPricing() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'greencart' });
    console.log("CONNECTED TO DATABASE:", mongoose.connection.name);
    const pricings = await Pricing.find({ type: 'printing_rules' });
    console.log("ALL PRINTING RULES DOCUMENTS:");
    console.log(JSON.stringify(pricings, null, 2));
    process.exit(0);
}

checkPricing();
