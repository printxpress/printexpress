import { v2 as cloudinary } from "cloudinary"

const connectCloudinary = async () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Verify Cloudinary connection
    const secret = process.env.CLOUDINARY_API_SECRET;
    if (!secret || secret === '**********' || secret.includes('*')) {
        console.log('\n╔══════════════════════════════════════╗');
        console.log('║  ⚠️  Cloudinary API Secret Missing   ║');
        console.log('║  Please set CLOUDINARY_API_SECRET    ║');
        console.log('║  in your .env file                   ║');
        console.log('╚══════════════════════════════════════╝\n');
    } else {
        console.log('☁️  Cloudinary Connected:', process.env.CLOUDINARY_CLOUD_NAME);
    }
}

export default connectCloudinary;