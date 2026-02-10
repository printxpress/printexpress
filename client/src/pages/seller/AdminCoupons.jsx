import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const AdminCoupons = () => {
    const { axios } = useAppContext();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        code: '', discountType: 'percentage', discountValue: '', minOrder: '',
        maxDiscount: '', usageLimit: '', validTill: '', description: ''
    });

    useEffect(() => { fetchCoupons(); }, []);

    const fetchCoupons = async () => {
        try {
            const { data } = await axios.get('/api/coupon/all');
            if (data.success) setCoupons(data.coupons || []);
        } catch (e) { console.log(e.message); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!form.code || !form.discountValue || !form.validTill) {
            return toast.error('Fill required fields: Code, Discount, Valid Till');
        }
        try {
            const { data } = await axios.post('/api/coupon/create', {
                ...form,
                discountValue: Number(form.discountValue),
                minOrder: Number(form.minOrder) || 0,
                maxDiscount: Number(form.maxDiscount) || 500,
                usageLimit: Number(form.usageLimit) || 100
            });
            if (data.success) {
                toast.success('Coupon created!');
                setForm({ code: '', discountType: 'percentage', discountValue: '', minOrder: '', maxDiscount: '', usageLimit: '', validTill: '', description: '' });
                setShowForm(false);
                fetchCoupons();
            } else toast.error(data.message);
        } catch (e) { toast.error(e.message); }
    };

    const handleToggle = async (id) => {
        try {
            const { data } = await axios.post('/api/coupon/toggle', { id });
            if (data.success) { toast.success(data.message); fetchCoupons(); }
        } catch (e) { toast.error(e.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this coupon?')) return;
        try {
            const { data } = await axios.post('/api/coupon/delete', { id });
            if (data.success) { toast.success('Deleted'); fetchCoupons(); }
        } catch (e) { toast.error(e.message); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-5xl animate-bounce">🎟️</div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold font-outfit">Coupons & Offers</h1>
                    <p className="text-sm text-text-muted">Create and manage discount coupons</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2 px-5 text-sm">
                    {showForm ? '✕ Cancel' : '+ New Coupon'}
                </button>
            </div>

            {/* Create Coupon Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-2xl border border-border space-y-4">
                    <h3 className="font-bold font-outfit">🎟️ Create New Coupon</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-bold text-text-muted block mb-1">Coupon Code *</label>
                            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                placeholder="PRINT20" className="w-full border border-border rounded-xl px-4 py-3 text-sm font-mono uppercase" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-text-muted block mb-1">Discount Type *</label>
                            <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}
                                className="w-full border border-border rounded-xl px-4 py-3 text-sm">
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat Amount (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-text-muted block mb-1">Discount Value *</label>
                            <input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })}
                                placeholder={form.discountType === 'percentage' ? '20' : '50'}
                                className="w-full border border-border rounded-xl px-4 py-3 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-text-muted block mb-1">Min Order (₹)</label>
                            <input type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })}
                                placeholder="100" className="w-full border border-border rounded-xl px-4 py-3 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-text-muted block mb-1">Max Discount (₹)</label>
                            <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                                placeholder="500" className="w-full border border-border rounded-xl px-4 py-3 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-text-muted block mb-1">Usage Limit</label>
                            <input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                                placeholder="100" className="w-full border border-border rounded-xl px-4 py-3 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-text-muted block mb-1">Valid Until *</label>
                            <input type="date" value={form.validTill} onChange={e => setForm({ ...form, validTill: e.target.value })}
                                className="w-full border border-border rounded-xl px-4 py-3 text-sm" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-text-muted block mb-1">Description</label>
                            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Get 20% off on all printing orders"
                                className="w-full border border-border rounded-xl px-4 py-3 text-sm" />
                        </div>
                    </div>
                    <button onClick={handleCreate} className="btn-primary py-3 px-8 text-sm">Create Coupon</button>
                </div>
            )}

            {/* Coupons List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.length === 0 ? (
                    <div className="col-span-3 text-center py-16 bg-white rounded-2xl border border-border">
                        <p className="text-4xl mb-3">🎟️</p>
                        <p className="text-text-muted">No coupons created yet</p>
                    </div>
                ) : (
                    coupons.map(c => (
                        <div key={c._id} className={`bg-white rounded-2xl border-2 p-5 space-y-3 transition-all hover:shadow-lg ${c.isActive ? 'border-green-200' : 'border-red-200 opacity-60'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-mono font-bold text-lg text-primary">{c.code}</p>
                                    <p className="text-xs text-text-muted">{c.description || 'No description'}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {c.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold text-primary">
                                    {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                                </p>
                                {c.minOrder > 0 && <p className="text-[10px] text-text-muted">Min order: ₹{c.minOrder}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-slate-50 rounded-lg p-2 text-center">
                                    <p className="text-text-muted">Used</p>
                                    <p className="font-bold">{c.usedCount}/{c.usageLimit}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-2 text-center">
                                    <p className="text-text-muted">Expires</p>
                                    <p className="font-bold">{new Date(c.validTill).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => handleToggle(c._id)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold ${c.isActive ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                    {c.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button onClick={() => handleDelete(c._id)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-100 text-red-700">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminCoupons;
