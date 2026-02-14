import User from "../models/User.js";
import Order from "../models/Order.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock OTP storage (In production, use Redis or a DB collection with TTL)
const otpStore = new Map();

// Send OTP : /api/user/send-otp
export const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.json({ success: false, message: 'Phone number is required' });

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with 5-minute expiry
        otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 });

        console.log(`OTP for ${phone}: ${otp}`); // For development/testing

        // TODO: Integrate with WhatsApp Cloud API or Twilio here

        return res.json({ success: true, message: 'OTP sent successfully', otp }); // Returning OTP for dev ease
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Verify OTP & Login/Register : /api/user/verify-otp
export const verifyOtp = async (req, res) => {
    try {
        const { phone, otp, name } = req.body;

        if (!phone || !otp) return res.json({ success: false, message: 'Phone and OTP are required' });

        // DEMO MODE: Accept any OTP (bypass verification)
        // logic is implicitly bypassed as we don't check otpStore here

        let user = await User.findOne({ phone });

        if (!user) {
            // New user registration
            user = await User.create({ phone, name, role: 'customer' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const isProfileComplete = !!(user.name && user.email);

        return res.json({ success: true, user: { phone: user.phone, name: user.name, role: user.role }, isProfileComplete });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Check Auth : /api/user/is-auth
export const isAuth = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user) return res.json({ success: false, message: 'User not found' });
        return res.json({ success: true, user });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Logout User : /api/user/logout
export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });
        return res.json({ success: true, message: "Logged Out" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Update User Profile : /api/user/update-profile
export const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, email, address } = req.body;

        // Validate mandatory address fields if address is being updated
        if (address) {
            const requiredFields = ['line1', 'pincode', 'city', 'state'];
            for (const field of requiredFields) {
                if (!address[field]) {
                    return res.json({ success: false, message: `Address field ${field} is mandatory` });
                }
            }
            if (!/^\d{6}$/.test(address.pincode)) {
                return res.json({ success: false, message: 'Invalid Pincode format (6 digits required)' });
            }
        }

        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.json({ success: false, message: 'Email already in use' });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(userId, {
            name,
            email,
            address
        }, { new: true });

        if (!updatedUser) return res.json({ success: false, message: 'User not found' });

        return res.json({ success: true, message: 'Profile Updated', user: updatedUser });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Get All Users (Admin) : /api/user/all
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 }).lean();
        const orders = await Order.find({});

        const usersWithStats = users.map(user => {
            const userOrders = orders.filter(o => o.userId?.toString() === user._id.toString());
            const totalSpent = userOrders.reduce((sum, o) => sum + (o.pricing?.totalAmount || 0), 0);
            return {
                ...user,
                orders: userOrders.length,
                totalSpent
            };
        });

        return res.json({ success: true, users: usersWithStats });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}
