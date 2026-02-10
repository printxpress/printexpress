import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const Login = () => {

    const { setShowUserLogin, setUser, axios } = useAppContext()

    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("phone"); // 'phone' or 'otp'
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post('/api/user/send-otp', { phone });
            if (data.success) {
                toast.success('OTP sent successfully');
                setStep("otp");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post('/api/user/verify-otp', { phone, otp, name });
            if (data.success) {
                setUser(data.user);
                setShowUserLogin(false);
                toast.success('LoggedIn successfully');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div onClick={() => setShowUserLogin(false)} className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm'>
            <div onClick={(e) => e.stopPropagation()} className="card-premium w-full max-w-md animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center text-center space-y-4 mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">📱</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-outfit text-primary">Phone Login</h2>
                        <p className="text-text-muted text-sm mt-1">Enter your phone number to continue</p>
                    </div>
                </div>

                {step === 'phone' ? (
                    <form onSubmit={handleSendOtp} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-main ml-1">PHONE NUMBER</label>
                            <input
                                onChange={(e) => setPhone(e.target.value)}
                                value={phone}
                                placeholder="+91 9876543210"
                                className="input-field"
                                type="tel"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-main ml-1">YOUR NAME</label>
                            <input
                                onChange={(e) => setName(e.target.value)}
                                value={name}
                                placeholder="John Doe"
                                className="input-field"
                                type="text"
                                required
                            />
                        </div>
                        <p className="text-xs text-text-muted italic px-1"> Include country code (e.g., +91 for India)</p>
                        <button
                            disabled={loading}
                            className="btn-primary w-full py-4 text-lg mt-1 disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-main ml-1">ENTER OTP</label>
                            <input
                                onChange={(e) => setOtp(e.target.value)}
                                value={otp}
                                placeholder="123456"
                                className="input-field text-center tracking-[1em] font-bold text-xl"
                                type="text"
                                maxLength={6}
                                required
                            />
                        </div>
                        <p className="text-sm text-center text-text-muted">
                            OTP sent to {phone} <span onClick={() => setStep('phone')} className="text-primary font-semibold cursor-pointer ml-1">Edit</span>
                        </p>
                        <button
                            disabled={loading}
                            className="btn-primary w-full py-4 text-lg disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Login / Register'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

export default Login
