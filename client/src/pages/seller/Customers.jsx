import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

const Customers = () => {
    const { axios } = useAppContext();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            // Try to fetch from API, fallback to demo data
            try {
                const { data } = await axios.get('/api/user/all');
                if (data.success) {
                    setCustomers(data.users || []);
                    setLoading(false);
                    return;
                }
            } catch (e) {
                // API not available, use demo data
            }

            // Demo data for display
            setCustomers([
                { _id: '1', name: 'Rajesh Kumar', phone: '+91 9123456789', email: 'rajesh@example.com', city: 'Mumbai', orders: 5, totalSpent: 1250, createdAt: '2026-01-15' },
                { _id: '2', name: 'Priya Sharma', phone: '+91 9234567890', email: 'priya@example.com', city: 'Delhi', orders: 3, totalSpent: 780, createdAt: '2026-01-20' },
                { _id: '3', name: 'Amit Patel', phone: '+91 9345678901', email: 'amit@example.com', city: 'Bangalore', orders: 8, totalSpent: 2340, createdAt: '2026-01-10' },
                { _id: '4', name: 'Sneha Reddy', phone: '+91 9456789012', email: 'sneha@example.com', city: 'Hyderabad', orders: 2, totalSpent: 460, createdAt: '2026-02-01' },
                { _id: '5', name: 'Vikram Singh', phone: '+91 9567890123', email: 'vikram@example.com', city: 'Chennai', orders: 12, totalSpent: 3670, createdAt: '2025-12-20' },
            ]);
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery) ||
        c.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-3">
                    <div className="text-4xl animate-bounce">👥</div>
                    <p className="text-text-muted">Loading customers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-outfit">Customers</h1>
                    <p className="text-sm text-text-muted">{customers.length} registered customers</p>
                </div>
                <input
                    type="text"
                    placeholder="Search by name, phone, or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field max-w-xs"
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-border">
                    <p className="text-xs text-text-muted">Total Customers</p>
                    <p className="text-2xl font-bold text-primary">{customers.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-border">
                    <p className="text-xs text-text-muted">Total Orders</p>
                    <p className="text-2xl font-bold text-green-600">{customers.reduce((acc, c) => acc + (c.orders || 0), 0)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-border">
                    <p className="text-xs text-text-muted">Total Revenue</p>
                    <p className="text-2xl font-bold text-orange-600">₹{customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-border">
                    <p className="text-xs text-text-muted">Avg. per Customer</p>
                    <p className="text-2xl font-bold text-purple-600">
                        ₹{customers.length > 0 ? Math.round(customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0) / customers.length) : 0}
                    </p>
                </div>
            </div>

            {/* Customer Table */}
            <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-text-muted">
                            <tr>
                                <th className="text-left p-4">Customer</th>
                                <th className="text-left p-4">Phone</th>
                                <th className="text-left p-4">City</th>
                                <th className="text-center p-4">Orders</th>
                                <th className="text-right p-4">Total Spent</th>
                                <th className="text-right p-4">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((customer, index) => (
                                <tr key={customer._id} className="border-t border-border hover:bg-blue-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center font-bold text-primary text-xs">
                                                {customer.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{customer.name}</p>
                                                <p className="text-xs text-text-muted">{customer.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-xs">{customer.phone}</td>
                                    <td className="p-4">{customer.city || '-'}</td>
                                    <td className="p-4 text-center">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{customer.orders || 0}</span>
                                    </td>
                                    <td className="p-4 text-right font-semibold">₹{(customer.totalSpent || 0).toLocaleString()}</td>
                                    <td className="p-4 text-right text-xs text-text-muted">
                                        {new Date(customer.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredCustomers.length === 0 && (
                    <div className="text-center py-12 text-text-muted">
                        <p className="text-4xl mb-2">🔍</p>
                        <p>No customers found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Customers;
