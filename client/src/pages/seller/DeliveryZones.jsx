import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const DeliveryZones = () => {
    const { axios } = useAppContext();
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        pincode: '',
        district: '',
        state: '',
        deliveryCharge: 40,
        estimatedDays: '2-3 Days',
        isAvailable: true
    });

    const fetchZones = async () => {
        try {
            const { data } = await axios.get('/api/delivery/all');
            if (data.success) setZones(data.zones);
        } catch (error) {
            toast.error("Failed to fetch zones");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/api/delivery/add', formData);
            if (data.success) {
                toast.success("Zone Saved");
                setShowAdd(false);
                fetchZones();
                setFormData({ pincode: '', district: '', state: '', deliveryCharge: 40, estimatedDays: '2-3 Days', isAvailable: true });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Error saving zone");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this zone?")) return;
        try {
            const { data } = await axios.delete(`/api/delivery/delete/${id}`);
            if (data.success) {
                toast.success("Zone Deleted");
                fetchZones();
            }
        } catch (error) {
            toast.error("Error deleting zone");
        }
    };

    const toggleAvailability = async (zone) => {
        try {
            const { data } = await axios.post('/api/delivery/add', { ...zone, isAvailable: !zone.isAvailable });
            if (data.success) {
                toast.success("Availability Updated");
                fetchZones();
            }
        } catch (error) {
            toast.error("Error updating zone");
        }
    };

    useEffect(() => { fetchZones(); }, []);

    if (loading) return <div className="p-8 text-center text-text-muted">Loading zones...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold font-outfit">Delivery Zones</h2>
                    <p className="text-xs text-text-muted">Manage serviceability and shipping costs by pincode</p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className={`btn-primary py-2 px-6 text-sm ${showAdd ? 'bg-red-500 hover:bg-red-600' : ''}`}
                >
                    {showAdd ? 'Cancel' : '+ Add Pincode'}
                </button>
            </div>

            {showAdd && (
                <div className="card-premium p-8 max-w-3xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Pincode</label>
                            <input
                                value={formData.pincode}
                                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                className="input-field"
                                placeholder="641001"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">District</label>
                            <input
                                value={formData.district}
                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                className="input-field"
                                placeholder="Coimbatore"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">State</label>
                            <input
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                className="input-field"
                                placeholder="Tamil Nadu"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Delivery Charge (₹)</label>
                            <input
                                type="number"
                                value={formData.deliveryCharge}
                                onChange={(e) => setFormData({ ...formData, deliveryCharge: Number(e.target.value) })}
                                className="input-field"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Estimated Days</label>
                            <input
                                value={formData.estimatedDays}
                                onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                                className="input-field"
                                placeholder="2-3 Days"
                                required
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={formData.isAvailable}
                                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                    />
                                    <div className={`block w-12 h-7 rounded-full transition-colors ${formData.isAvailable ? 'bg-primary' : 'bg-slate-300'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${formData.isAvailable ? 'translate-x-5' : ''}`}></div>
                                </div>
                                <span className="text-xs font-bold uppercase text-text-muted">Available</span>
                            </label>
                        </div>
                        <div className="md:col-span-3 pt-4 border-t border-border mt-2">
                            <button className="btn-primary w-full py-3">Save Delivery Zone</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-border">
                        <tr className="text-xs font-bold text-text-muted uppercase tracking-wider">
                            <th className="px-6 py-4">Pincode</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4 text-center">Charge</th>
                            <th className="px-6 py-4 text-center">ETA</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {zones.map((zone) => (
                            <tr key={zone._id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-bold text-blue-600 font-mono tracking-tighter">
                                    {zone.pincode}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-semibold">{zone.district}</p>
                                    <p className="text-[10px] text-text-muted uppercase">{zone.state}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="font-bold">₹{zone.deliveryCharge}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-medium bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100 italic">
                                        {zone.estimatedDays}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => toggleAvailability(zone)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${zone.isAvailable
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                }`}
                                        >
                                            {zone.isAvailable ? 'Active' : 'Disabled'}
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(zone._id)}
                                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <span className="text-sm">🗑️ Delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {zones.length === 0 && (
                    <div className="py-20 text-center space-y-3">
                        <span className="text-5xl">🚚</span>
                        <p className="text-text-muted font-medium">No delivery zones added yet.</p>
                        <button onClick={() => setShowAdd(true)} className="text-primary font-bold text-sm">Add your first service area</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryZones;
