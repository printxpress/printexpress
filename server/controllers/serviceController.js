import Service from "../models/Service.js";

// Get All Services : /api/services
export const getServices = async (req, res) => {
    try {
        const services = await Service.find({});
        res.json({ success: true, services });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Add Service (Admin) : /api/services/add
export const addService = async (req, res) => {
    try {
        const { name, icon, description, priceRange, category, whatsappEnquiryLink } = req.body;
        const service = await Service.create({ name, icon, description, priceRange, category, whatsappEnquiryLink });
        res.json({ success: true, service });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Update Service (Admin) : /api/services/update
export const updateService = async (req, res) => {
    try {
        const { id, ...updateData } = req.body;
        const service = await Service.findByIdAndUpdate(id, updateData, { new: true });
        res.json({ success: true, service });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Delete Service (Admin) : /api/services/delete
export const deleteService = async (req, res) => {
    try {
        const { id } = req.body;
        await Service.findByIdAndDelete(id);
        res.json({ success: true, message: "Service Deleted" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}
