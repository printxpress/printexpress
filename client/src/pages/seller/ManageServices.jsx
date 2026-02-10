import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const ManageServices = () => {
    const { axios } = useAppContext();
    const [services, setServices] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [editId, setEditId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [icon, setIcon] = useState('📄');
    const [category, setCategory] = useState('Printing');

    const fetchServices = async () => {
        try {
            const { data } = await axios.get('/api/services');
            if (data.success) setServices(data.services);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const endpoint = editId ? '/api/services/update' : '/api/services/add';
            const payload = editId ? { id: editId, name, description, price, icon, category } : { name, description, price, icon, category };

            const { data } = await axios.post(endpoint, payload);
            if (data.success) {
                toast.success(editId ? "Service Updated" : "Service Added");
                setShowAdd(false);
                setEditId(null);
                fetchServices();
                resetForm();
            }
        } catch (error) {
            toast.error(error.message);
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this service?")) return;
        try {
            const { data } = await axios.post('/api/services/delete', { id });
            if (data.success) {
                toast.success("Service Deleted");
                fetchServices();
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleEdit = (s) => {
        setEditId(s._id);
        setName(s.name);
        setDescription(s.description);
        setPrice(s.price);
        setIcon(s.icon);
        setCategory(s.category || 'Printing');
        setShowAdd(true);
    };

    const resetForm = () => {
        setName(''); setDescription(''); setPrice(''); setIcon('📄'); setCategory('Printing'); setEditId(null);
    };

    useEffect(() => { fetchServices(); }, []);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold font-outfit">Print Services</h2>
                    <p className="text-xs text-text-muted">Manage your printing service catalog</p>
                </div>
                <button onClick={() => { if (showAdd) resetForm(); setShowAdd(!showAdd); }} className="btn-primary py-2 px-6 text-sm">
                    {showAdd ? 'Close' : '+ Add Service'}
                </button>
            </div>

            {showAdd && (
                <div className="card-premium p-8 max-w-2xl animate-in zoom-in-95 duration-300">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Service Name</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="e.g. A3 Color Print" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Price (Starts from ₹)</label>
                            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="input-field" placeholder="e.g. 100" required />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Description</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field h-24 pt-3" placeholder="Describe the printing service..." required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Choose Icon</label>
                            <select value={icon} onChange={(e) => setIcon(e.target.value)} className="input-field">
                                <option value="📄">Document 📄</option>
                                <option value="🖨️">Printer 🖨️</option>
                                <option value="🖼️">Photo 🖼️</option>
                                <option value="📚">Binding 📚</option>
                                <option value="🪪">ID Card 🪪</option>
                                <option value="📋">Bulk 📋</option>
                                <option value="🏷️">Label 🏷️</option>
                                <option value="📦">Package 📦</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
                                <option value="Printing">Printing</option>
                                <option value="Binding">Binding</option>
                                <option value="Lamination">Lamination</option>
                                <option value="ID Card">ID Card</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 pt-4">
                            <button disabled={loading} className="btn-primary w-full py-3">{loading ? 'Saving...' : editId ? 'Update Service' : 'Save Service'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Default printing services display */}
            {services.length === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[
                        { icon: '📄', name: 'B/W A4 Print', description: 'Black & white document printing on standard A4 paper', price: 2, status: 'Active' },
                        { icon: '🌈', name: 'Color A4 Print', description: 'Full color document printing on A4 paper', price: 10, status: 'Active' },
                        { icon: '🖼️', name: 'Photo Print (4x6)', description: 'High quality photo printing in 4x6 inch format', price: 15, status: 'Active' },
                        { icon: '🪪', name: 'PVC ID Card', description: 'Durable PVC ID cards with photos and text', price: 100, status: 'Active' },
                        { icon: '📚', name: 'Spiral Binding', description: 'Professional spiral binding for documents', price: 50, status: 'Active' },
                        { icon: '📋', name: 'Lamination (A4)', description: 'Protective lamination for A4 documents', price: 30, status: 'Active' },
                    ].map((s, i) => (
                        <div key={i} className="card-premium p-6 flex flex-col justify-between hover:border-primary/40 transition-colors group">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-4xl">{s.icon}</span>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold">{s.status}</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold font-outfit">{s.name}</h3>
                                    <p className="text-text-muted text-sm line-clamp-2 mt-1">{s.description}</p>
                                </div>
                            </div>
                            <div className="pt-6 flex justify-between items-center border-t border-border mt-6">
                                <span className="text-primary font-bold">₹{s.price}</span>
                                <div className="flex gap-2">
                                    <button disabled className="btn-outline px-3 py-1 text-[10px] font-bold opacity-50 cursor-not-allowed">EDIT</button>
                                    <button disabled className="btn-outline px-3 py-1 text-[10px] font-bold text-red-500 border-red-200 opacity-50 cursor-not-allowed">DEL</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Services from DB */}
            {services.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {services.map((s, i) => (
                        <div key={i} className="card-premium p-6 flex flex-col justify-between hover:border-primary/40 transition-colors group">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-4xl">{s.icon}</span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(s)} className="btn-outline px-3 py-1 text-[10px] font-bold">EDIT</button>
                                        <button onClick={() => handleDelete(s._id)} className="btn-outline px-3 py-1 text-[10px] font-bold text-red-500 border-red-200">DEL</button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold font-outfit">{s.name}</h3>
                                    <p className="text-text-muted text-sm line-clamp-2 mt-1">{s.description}</p>
                                </div>
                            </div>
                            <div className="pt-6 flex justify-between items-center border-t border-border mt-6">
                                <span className="text-primary font-bold">₹{s.price}</span>
                                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{s.status || 'Active'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageServices;
