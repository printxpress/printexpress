import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log('\n╔══════════════════════════════════════╗');
            console.log('║  ✅ Database Connected Successfully  ║');
            console.log('║  📦 MongoDB Atlas - greencart        ║');
            console.log('╚══════════════════════════════════════╝\n');
        });

        mongoose.connection.on('error', (err) => {
            console.log('\n╔══════════════════════════════════════╗');
            console.log('║  ❌ Database Connection Failed       ║');
            console.log(`║  Error: ${err.message.substring(0, 28).padEnd(28)} ║`);
            console.log('╚══════════════════════════════════════╝\n');
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  Database Disconnected');
        });

        const uri = process.env.MONGODB_URI.endsWith('/')
            ? process.env.MONGODB_URI.slice(0, -1)
            : process.env.MONGODB_URI;

        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(`${uri}/greencart`);
    } catch (error) {
        console.error('\n❌ Database Connection Error:', error.message);
        console.error('   Please check your MONGODB_URI in .env\n');
    }
}

export default connectDB;