import jwt from 'jsonwebtoken';
import Order from "../models/Order.js";
import User from "../models/User.js";

// Login Seller : /api/seller/login
export const sellerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (password === process.env.SELLER_PASSWORD && email === process.env.SELLER_EMAIL) {
            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' });

            res.cookie('sellerToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.json({ success: true, message: "Logged In" });
        } else {
            return res.json({ success: false, message: "Invalid Credentials" });
        }
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Seller isAuth : /api/seller/is-auth
export const isSellerAuth = async (req, res) => {
    try {
        return res.json({ success: true })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Logout Seller : /api/seller/logout
export const sellerLogout = async (req, res) => {
    try {
        res.clearCookie('sellerToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });
        return res.json({ success: true, message: "Logged Out" })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Get Seller Analytics : /api/seller/analytics
export const getSellerAnalytics = async (req, res) => {
    try {
        const orders = await Order.find({});
        const usersCount = await User.countDocuments({});

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((acc, order) => acc + (order.pricing.totalAmount || 0), 0);
        const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

        // Calculate weekly distribution (last 7 days)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyStats = days.map(day => ({ day, orders: 0, revenue: 0 }));

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            if (orderDate >= sevenDaysAgo) {
                const dayIndex = orderDate.getDay();
                weeklyStats[dayIndex].orders += 1;
                weeklyStats[dayIndex].revenue += (order.pricing.totalAmount || 0);
            }
        });

        // Top Services (Simplified from order options)
        const servicesStats = {
            'B/W Printing': orders.filter(o => o.printOptions.mode === 'B/W').length,
            'Color Printing': orders.filter(o => o.printOptions.mode === 'Color').length,
            'Binding': orders.filter(o => o.printOptions.binding !== 'None').length,
        };

        const topServices = Object.keys(servicesStats).map(name => ({
            name,
            count: servicesStats[name],
            revenue: 0, // Simplified for now
            color: name === 'B/W Printing' ? 'blue' : (name === 'Color Printing' ? 'orange' : 'green')
        })).sort((a, b) => b.count - a.count);

        return res.json({
            success: true,
            stats: {
                totalOrders,
                totalRevenue,
                avgOrderValue,
                totalUsers: usersCount,
                weeklyStats,
                topServices
            }
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}