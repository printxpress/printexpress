import DeliveryZone from "../models/DeliveryZone.js";

// Check Delivery Availability : /api/delivery/check/:pincode
export const checkDelivery = async (req, res) => {
    try {
        const { pincode } = req.params;
        const zone = await DeliveryZone.findOne({ pincode, isAvailable: true });
        if (zone) {
            res.json({ success: true, zone });
        } else {
            res.json({ success: false, message: 'Delivery not available in this area' });
        }
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Get all delivery zones (Admin) : /api/delivery/all
export const getAllZones = async (req, res) => {
    try {
        const zones = await DeliveryZone.find({}).sort({ pincode: 1 });
        res.json({ success: true, zones });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Add/Update Delivery Zone (Admin) : /api/delivery/add
export const addUpdateZone = async (req, res) => {
    try {
        const { pincode, district, state, isAvailable, deliveryCharge, estimatedDays } = req.body;
        const zone = await DeliveryZone.findOneAndUpdate(
            { pincode },
            { district, state, isAvailable, deliveryCharge, estimatedDays },
            { new: true, upsert: true }
        );
        res.json({ success: true, zone });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Delete Delivery Zone (Admin) : /api/delivery/delete/:id
export const deleteZone = async (req, res) => {
    try {
        const { id } = req.params;
        await DeliveryZone.findByIdAndDelete(id);
        res.json({ success: true, message: "Zone Deleted" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
