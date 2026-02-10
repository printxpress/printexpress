import SupportQuery from "../models/SupportQuery.js";

// Create Support Query : /api/support/create
export const createQuery = async (req, res) => {
    try {
        const { userId, phone, subject, message } = req.body;
        const query = await SupportQuery.create({
            userId,
            phone,
            subject,
            message
        });
        res.json({ success: true, message: 'Query Submitted', query });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get User Queries : /api/support/user
export const getUserQueries = async (req, res) => {
    try {
        const { userId } = req.body;
        const queries = await SupportQuery.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, queries });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get All Queries (Admin) : /api/support/all
export const getAllQueries = async (req, res) => {
    try {
        const queries = await SupportQuery.find({}).populate('userId', 'name phone').sort({ createdAt: -1 });
        res.json({ success: true, queries });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
