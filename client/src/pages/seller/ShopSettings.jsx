import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const ShopSettings = () => {
    const { axios } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        whatsapp: '',
        deliveryBaseCharge: 40
    });

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get('/api/shop/settings');
            if (data.success) {
                setSettings(data.settings);
            }
        } catch (error) {
            toast.error("Failed to load settings");
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post('/api/shop/update', settings);
            if (data.success) {
                toast.success("Settings Updated Successfully");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Update failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold font-outfit">Store Settings</h2>
                <p className="text-text-muted">Configure your shop identity and contact information</p>
            </div>

            <form onSubmit={handleUpdate} className="card-premium p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Store Name</label>
                        <input
                            value={settings.name}
                            onChange={e => setSettings({ ...settings, name: e.target.value })}
                            className="input-field"
                            placeholder="Print Express"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Base Delivery Charge (₹)</label>
                        <input
                            type="number"
                            value={settings.deliveryBaseCharge}
                            onChange={e => setSettings({ ...settings, deliveryBaseCharge: Number(e.target.value) })}
                            className="input-field"
                            placeholder="40"
                            required
                        />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Store Address</label>
                        <textarea
                            value={settings.address}
                            onChange={e => setSettings({ ...settings, address: e.target.value })}
                            className="input-field min-h-[100px] py-3"
                            placeholder="Full store address for customers to see"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Contact Phone</label>
                        <input
                            value={settings.phone}
                            onChange={e => setSettings({ ...settings, phone: e.target.value })}
                            className="input-field"
                            placeholder="Phone number"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Contact Email</label>
                        <input
                            type="email"
                            value={settings.email}
                            onChange={e => setSettings({ ...settings, email: e.target.value })}
                            className="input-field"
                            placeholder="Email address"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">WhatsApp Support Number</label>
                        <input
                            value={settings.whatsapp}
                            onChange={e => setSettings({ ...settings, whatsapp: e.target.value })}
                            className="input-field"
                            placeholder="Include country code, e.g. 91..."
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button type="submit" disabled={loading} className="btn-primary px-8 py-3">
                        {loading ? 'Saving...' : 'Save Settings 💾'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ShopSettings;
