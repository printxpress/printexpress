import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const AdminWallet = () => {
    const { axios } = useAppContext();
    const [customers, setCustomers] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [action, setAction] = useState('credit');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [usersRes, walletsRes] = await Promise.all([
                axios.get('/api/user/all'),
                axios.get('/api/wallet/all')
            ]);
            if (usersRes.data.success) setCustomers(usersRes.data.users || []);
            if (walletsRes.data.success) setWallets(walletsRes.data.wallets || []);
        } catch (e) { console.log(e.message); }
        finally { setLoading(false); }
    };

    const getWalletBalance = (userId) => {
        const w = wallets.find(w => w.userId?._id === userId);
        return w?.balance || 0;
    };

    const getTransactions = (userId) => {
        const w = wallets.find(w => w.userId?._id === userId);
        return w?.transactions || [];
    };

    const handleSubmit = async () => {
        if (!selectedUser || !amount || Number(amount) <= 0) {
            return toast.error('Select user and enter valid amount');
        }
        const endpoint = action === 'credit' ? '/api/wallet/add' : '/api/wallet/deduct';
        try {
            const { data } = await axios.post(endpoint, {
                userId: selectedUser,
                amount: Number(amount),
                description: description || (action === 'credit' ? 'Coins added by admin' : 'Coins deducted by admin')
            });
            if (data.success) {
                toast.success(data.message);
                setAmount('');
                setDescription('');
                fetchData();
            } else {
                toast.error(data.message);
            }
        } catch (e) { toast.error(e.message); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-5xl animate-bounce">💰</div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold font-outfit">Wallet Management</h1>
                <p className="text-sm text-text-muted">Manage customer wallet coins and transactions</p>
            </div>

            {/* Add/Deduct Coins */}
            <div className="bg-white p-6 rounded-2xl border border-border space-y-4">
                <h3 className="font-bold font-outfit">💰 Add / Deduct Coins</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-text-muted block mb-1">Select Customer</label>
                        <select value={selectedUser || ''} onChange={e => setSelectedUser(e.target.value)}
                            className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none">
                            <option value="">Choose customer...</option>
                            {customers.map(c => (
                                <option key={c._id} value={c._id}>{c.name || 'Unnamed'} — {c.phone} (₹{getWalletBalance(c._id)})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-text-muted block mb-1">Action</label>
                        <select value={action} onChange={e => setAction(e.target.value)}
                            className="w-full border border-border rounded-xl px-4 py-3 text-sm">
                            <option value="credit">➕ Add Coins</option>
                            <option value="debit">➖ Deduct Coins</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-text-muted block mb-1">Amount (₹)</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="100"
                            className="w-full border border-border rounded-xl px-4 py-3 text-sm" />
                    </div>
                    <button onClick={handleSubmit}
                        className="btn-primary py-3 px-6 text-sm">{action === 'credit' ? '➕ Add' : '➖ Deduct'}</button>
                </div>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Reason (e.g., Referral bonus, Order reward, Manual adjustment)"
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm" />
            </div>

            {/* All Customers with Wallet */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="p-5 border-b border-border">
                    <h3 className="font-bold font-outfit">All Customers</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left">
                            <tr>
                                <th className="p-4 font-bold text-text-muted text-xs uppercase">Customer</th>
                                <th className="p-4 font-bold text-text-muted text-xs uppercase">Phone</th>
                                <th className="p-4 font-bold text-text-muted text-xs uppercase">Wallet Balance</th>
                                <th className="p-4 font-bold text-text-muted text-xs uppercase">Transactions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {customers.map(c => (
                                <tr key={c._id} className="hover:bg-blue-50/30">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                                                {c.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <span className="font-medium">{c.name || 'Unnamed'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-text-muted">{c.phone}</td>
                                    <td className="p-4">
                                        <span className={`text-lg font-bold ${getWalletBalance(c._id) > 0 ? 'text-green-600' : 'text-text-muted'}`}>
                                            ₹{getWalletBalance(c._id)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <details className="cursor-pointer">
                                            <summary className="text-primary text-xs font-bold">View History ({getTransactions(c._id).length})</summary>
                                            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                                {getTransactions(c._id).length === 0 ? (
                                                    <p className="text-xs text-text-muted">No transactions</p>
                                                ) : (
                                                    getTransactions(c._id).slice(0, 10).map((t, i) => (
                                                        <div key={i} className={`text-xs px-3 py-2 rounded-lg ${t.type === 'credit' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                            <span className="font-bold">{t.type === 'credit' ? '+' : '-'}₹{t.amount}</span> — {t.description || 'No description'}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </details>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminWallet;
