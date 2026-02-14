import mongoose from "mongoose";

const seedServices = async () => {
    try {
        const Service = mongoose.model('service');
        const count = await Service.countDocuments();
        if (count === 0) {
            const defaultServices = [
                { icon: '📄', name: 'B/W A4 Print', description: 'Black & white document printing on standard A4 paper', price: 2, category: 'Printing', status: 'Active' },
                { icon: '🌈', name: 'Color A4 Print', description: 'Full color document printing on A4 paper', price: 10, category: 'Printing', status: 'Active' },
                { icon: '🖼️', name: 'Photo Print (4x6)', description: 'High quality photo printing in 4x6 inch format', price: 15, category: 'Printing', status: 'Active' },
                { icon: '🪪', name: 'PVC ID Card', description: 'Durable PVC ID cards with photos and text', price: 100, category: 'ID Card', status: 'Active' },
                { icon: '📚', name: 'Spiral Binding', description: 'Professional spiral binding for documents', price: 50, category: 'Binding', status: 'Active' },
                { icon: '📋', name: 'Lamination (A4)', description: 'Protective lamination for A4 documents', price: 30, category: 'Lamination', status: 'Active' },
            ];
            await Service.insertMany(defaultServices);
            console.log('✅ Seeded default services');
        }
    } catch (error) {
        console.error('❌ Service Seeding Error:', error.message);
    }
}

const seedStaffUsers = async () => {
    try {
        const User = mongoose.model('user');

        const staffData = [
            {
                name: 'Admin',
                email: 'admin@printexpress.com',
                password: 'Anbu@24',
                role: 'admin',
                phone: '0000000000'
            },
            {
                name: 'Billing',
                email: 'billing@printexpress.com',
                password: 'Billing@123',
                role: 'billing_manager',
                phone: '1111111111'
            }
        ];

        for (const staff of staffData) {
            const exists = await User.findOne({ role: staff.role });
            if (!exists) {
                await User.create(staff);
                console.log(`✅ Seeded ${staff.role} user`);
            }
        }
    } catch (error) {
        console.error('❌ Seeding Error:', error.message);
    }
}

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', async () => {
            console.log('\n╔══════════════════════════════════════╗');
            console.log('║  ✅ Database Connected Successfully  ║');
            console.log('║  📦 MongoDB Atlas - greencart        ║');
            console.log('╚══════════════════════════════════════╝\n');
            await seedStaffUsers();
            await seedServices();
            global.isDbConnected = true;
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ Database Connection Error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  Database Disconnected');
        });

        // ... (rest of connection logic)
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.log('⚠️  MONGODB_URI is missing. Falling back to local MongoDB.');
            await mongoose.connect('mongodb://localhost:27017/print-express');
        } else {
            console.log('ℹ️  connecting to remote MongoDB...');

            // Connection Options for better stability
            const options = {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            };

            await mongoose.connect(uri, options);
        }
    } catch (error) {
        console.error('\n❌ Database Connection Error:', error.message);
        global.isDbConnected = false;
    }
}

export default connectDB;