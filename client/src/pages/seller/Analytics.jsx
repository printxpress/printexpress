import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const Analytics = () => {
    const { axios } = useAppContext();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        try {
            const { data } = await axios.get('/api/seller/analytics');
            if (data.success) {
                setStats(data.stats);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-3">
                    <div className="text-4xl animate-bounce">📊</div>
                    <p className="text-text-muted">Loading analytics...</p>
                </div>
            </div>
        );
    }

    const maxOrders = Math.max(...stats.weeklyStats.map(d => d.orders), 1);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-outfit">Analytics Dashboard</h1>
                <p className="text-sm text-text-muted">Overview of your printing business performance</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-border space-y-1 shadow-sm">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Total Orders</p>
                    <p className="text-3xl font-bold font-outfit text-primary">{stats.totalOrders}</p>
                    <p className="text-[10px] text-text-muted font-medium">Lifetime orders</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-border space-y-1 shadow-sm">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Total Revenue</p>
                    <p className="text-3xl font-bold font-outfit text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
                    <p className="text-[10px] text-text-muted font-medium">Lifetime revenue</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-border space-y-1 shadow-sm">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Avg. Order</p>
                    <p className="text-3xl font-bold font-outfit text-orange-600">₹{stats.avgOrderValue}</p>
                    <p className="text-[10px] text-text-muted font-medium">Per order average</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-border space-y-1 shadow-sm">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Customers</p>
                    <p className="text-3xl font-bold font-outfit text-purple-600">{stats.totalUsers}</p>
                    <p className="text-[10px] text-text-muted font-medium">Registered users</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Orders Bar Chart */}
                <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
                    <h3 className="font-bold font-outfit mb-6 flex justify-between items-center">
                        <span>Weekly Performance</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-text-muted uppercase">Last 7 Days</span>
                    </h3>
                    <div className="flex items-end gap-3 h-48 px-2">
                        {stats.weeklyStats.map((day, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    {day.orders}
                                </span>
                                <div
                                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:scale-x-110 shadow-sm"
                                    style={{ height: `${(day.orders / maxOrders) * 100}%`, minHeight: '4px' }}
                                ></div>
                                <span className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">{day.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Services */}
                <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
                    <h3 className="font-bold font-outfit mb-6">Service Popularity</h3>
                    <div className="space-y-5">
                        {stats.topServices.map((service, i) => {
                            const percentage = stats.totalOrders > 0 ? (service.count / stats.totalOrders) * 100 : 0;
                            return (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold text-text-main">{service.name}</span>
                                        <span className="text-text-muted font-medium">{service.count} Orders ({percentage.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${service.color === 'blue' ? 'bg-blue-500' :
                                                    service.color === 'orange' ? 'bg-orange-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                        {stats.topServices.length === 0 && (
                            <div className="py-10 text-center text-text-muted text-sm italic">
                                No order data available yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Additional Insights */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-8 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10 space-y-2">
                    <h3 className="text-xl font-bold font-outfit">Ready to grow? 🚀</h3>
                    <p className="text-blue-100 text-sm max-w-md">Your revenue is up this week! Try creating a new coupon to boost weekend sales even further.</p>
                </div>
                <button
                    onClick={() => window.location.href = '/seller/coupons'}
                    className="bg-white text-blue-900 px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition-all relative z-10 whitespace-nowrap"
                >
                    Create Coupon 🎟️
                </button>
            </div>
        </div>
    );
};

export default Analytics;
