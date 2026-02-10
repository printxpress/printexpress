import ShopSettings from "../models/ShopSettings.js";

// Get Shop Settings : /api/shop/settings
export const getShopSettings = async (req, res) => {
    try {
        let settings = await ShopSettings.findOne({});
        if (!settings) {
            // Seed default settings if none exist
            settings = await ShopSettings.create({
                name: "Print Express",
                address: "Print Express Store, Coimbatore",
                phone: "9876543210",
                email: "support@printexpress.in",
                whatsapp: "9876543210",
                deliveryBaseCharge: 40
            });
        }
        res.json({ success: true, settings });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Update Shop Settings : /api/shop/update
export const updateShopSettings = async (req, res) => {
    try {
        const { name, address, phone, email, whatsapp, deliveryBaseCharge } = req.body;
        const settings = await ShopSettings.findOneAndUpdate({}, {
            name,
            address,
            phone,
            email,
            whatsapp,
            deliveryBaseCharge
        }, { new: true, upsert: true });

        res.json({ success: true, message: "Settings Updated", settings });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}
