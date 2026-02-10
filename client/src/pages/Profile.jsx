import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const Profile = () => {
    const { axios, user, setUser } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [queries, setQueries] = useState([]);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        address: {
            line1: user?.address?.line1 || '',
            pincode: user?.address?.pincode || '',
            district: user?.address?.district || '',
            state: user?.address?.state || '',
            landmark: user?.address?.landmark || ''
        }
    });

    const [queryForm, setQueryForm] = useState({
        subject: '',
        message: ''
    });

    useEffect(() => {
        if (user) {
            fetchQueries();
            setFormData({
                name: user.name || '',
                email: user.email || '',
                address: {
                    line1: user.address?.line1 || '',
                    pincode: user.address?.pincode || '',
                    district: user.address?.district || '',
                    state: user.address?.state || '',
                    landmark: user.address?.landmark || ''
                }
            });
        }
    }, [user]);

    const fetchQueries = async () => {
        try {
            const { data } = await axios.get('/api/support/user', { params: { userId: user._id } });
            if (data.success) setQueries(data.queries);
        } catch (error) {
            console.error(error);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post('/api/user/update-profile', {
                userId: user._id,
                ...formData
            });
            if (data.success) {
                toast.success("Profile Updated");
                setUser(data.user);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Update failed");
        } finally {
            setLoading(false);
        }
    };

    const handleQuerySubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/api/support/create', {
                userId: user._id,
                phone: user.phone,
                ...queryForm
            });
            if (data.success) {
                toast.success("Query Submitted");
                setQueryForm({ subject: '', message: '' });
                fetchQueries();
            }
        } catch (error) {
            toast.error("Submission failed");
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-12 px-4 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-bold font-outfit">My Profile</h1>
                    <p className="text-text-muted">Manage your account, address and support queries</p>
                </div>
                <div className="card-premium bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 min-w-[240px] shadow-xl shadow-blue-200/50">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-80">Wallet Balance</p>
                    <p className="text-4xl font-bold mt-2">₹{user?.walletBalance || 0}</p>
                    <p className="text-[10px] mt-3 bg-white/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm">Synced with your number: {user?.phone}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile & Address Form */}
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleProfileUpdate} className="card-premium space-y-8 pt-8">
                        <section className="space-y-6">
                            <h3 className="text-lg font-bold font-outfit text-primary flex items-center gap-2">
                                <span className="w-2 h-6 bg-primary rounded-full"></span>
                                Personal Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-muted ml-2">FULL NAME</label>
                                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Enter your name" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-muted ml-2">EMAIL ADDRESS</label>
                                    <input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="Enter email" />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-lg font-bold font-outfit text-primary flex items-center gap-2">
                                <span className="w-2 h-6 bg-primary rounded-full"></span>
                                Delivery Address
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-xs font-bold text-text-muted ml-2">HOUSE / BUILDING / STREET</label>
                                    <input value={formData.address.line1} onChange={e => setFormData({ ...formData, address: { ...formData.address, line1: e.target.value } })} className="input-field" placeholder="Complete address details" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-muted ml-2">PINCODE</label>
                                    <input value={formData.address.pincode} onChange={e => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })} className="input-field" placeholder="600001" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-muted ml-2">LANDMARK</label>
                                    <input value={formData.address.landmark} onChange={e => setFormData({ ...formData, address: { ...formData.address, landmark: e.target.value } })} className="input-field" placeholder="Near post office" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-muted ml-2">DISTRICT</label>
                                    <input value={formData.address.district} onChange={e => setFormData({ ...formData, address: { ...formData.address, district: e.target.value } })} className="input-field" placeholder="Coimbatore" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-muted ml-2">STATE</label>
                                    <input value={formData.address.state} onChange={e => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} className="input-field" placeholder="Tamil Nadu" />
                                </div>
                            </div>
                        </section>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-lg mt-4 shadow-lg shadow-primary/20">
                            {loading ? 'Saving Changes...' : 'SAVE PROFILE DETAILS 🚀'}
                        </button>
                    </form>
                </div>

                {/* Queries & Support */}
                <div className="space-y-8">
                    <div className="card-premium space-y-6">
                        <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
                            <span className="text-xl">💬</span>
                            Need Help?
                        </h3>
                        <form onSubmit={handleQuerySubmit} className="space-y-4">
                            <input required value={queryForm.subject} onChange={e => setQueryForm({ ...queryForm, subject: e.target.value })} className="input-field text-sm" placeholder="Subject (e.g. Order #123 issue)" />
                            <textarea required rows={4} value={queryForm.message} onChange={e => setQueryForm({ ...queryForm, message: e.target.value })} className="input-field text-sm resize-none" placeholder="Describe your query..." />
                            <button className="btn-outline w-full py-3 text-sm font-bold">SUBMIT TICKET</button>
                        </form>
                    </div>

                    <div className="card-premium p-0 overflow-hidden">
                        <div className="p-5 border-b border-border flex items-center justify-between">
                            <h3 className="font-bold text-sm">Ticket History</h3>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold">{queries.length}</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto no-scrollbar divide-y divide-border">
                            {queries.map((q, i) => (
                                <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-xs font-bold truncate pr-2">{q.subject}</p>
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${q.status === 'Open' ? 'bg-blue-100 text-blue-600' :
                                                q.status === 'Resolved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                            }`}>{q.status}</span>
                                    </div>
                                    <p className="text-[10px] text-text-muted line-clamp-1">{q.message}</p>
                                    <p className="text-[8px] text-text-muted mt-2 uppercase tracking-tighter">{new Date(q.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))}
                            {queries.length === 0 && (
                                <div className="py-12 text-center opacity-30">
                                    <p className="text-2xl mb-2">🎫</p>
                                    <p className="text-[10px] font-bold">No tickets yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
