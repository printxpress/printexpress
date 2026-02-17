import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const MyOrders = () => {

    const [myOrders, setMyOrders] = useState([])
    const { axios, user, setShowUserLogin } = useAppContext()

    const fetchMyOrders = async () => {
        try {
            const { data } = await axios.get('/api/order/user')
            if (data.success) {
                setMyOrders(data.orders)
            }
        } catch (error) {
            console.log(error);
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'received': return 'bg-blue-100 text-blue-600';
            case 'printing': return 'bg-yellow-100 text-yellow-600';
            case 'ready': return 'bg-purple-100 text-purple-600';
            case 'delivered': return 'bg-green-100 text-green-600';
            case 'failed': return 'bg-red-100 text-red-600';
            case 'cancelled': return 'bg-gray-100 text-gray-500 line-through';
            default: return 'bg-gray-100 text-gray-600';
        }
    }

    const trackOnWA = (order) => {
        const supportPhone = "+919876543210"; // Print Express Support
        const message = `Hello Print Express! I'd like to track my order #${order._id.toString().slice(-8).toUpperCase()}. It is currently ${order.status.toUpperCase()}.`;
        window.open(`https://wa.me/${supportPhone}?text=${encodeURIComponent(message)}`, '_blank');
    }

    useEffect(() => {
        if (!user) {
            setShowUserLogin(true);
        } else {
            fetchMyOrders()
        }
    }, [user, setShowUserLogin])

    if (!user) return <div className="min-h-screen flex items-center justify-center font-outfit text-slate-500">Authenticating...</div>;

    return (
        <div className='py-12 space-y-12'>
            <div className='flex flex-col items-center text-center space-y-2'>
                <h1 className='text-4xl font-bold font-outfit tracking-tight'>My Orders</h1>
                <p className='text-text-muted'>Track and manage your recent print requests</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
                {myOrders.length === 0 ? (
                    <div className="card-premium p-16 flex flex-col items-center gap-4 text-center">
                        <span className="text-6xl">📦</span>
                        <h3 className="text-xl font-bold font-outfit">No orders found</h3>
                        <p className="text-text-muted">You haven't placed any print orders yet.</p>
                        <button onClick={() => navigate('/print')} className="btn-primary mt-4">Start Printing Now</button>
                    </div>
                ) : (
                    myOrders.map((order, index) => (
                        <div key={index} className='card-premium p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500' style={{ animationDelay: `${index * 100}ms` }}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
                                <div>
                                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">ORDER ID</p>
                                    <p className="font-outfit font-bold text-lg">#{order._id.toString().slice(-8).toUpperCase()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                    <p className="text-sm font-bold text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">PRINT DETAILS</p>
                                    <div className="space-y-2">
                                        <p className="flex justify-between text-sm"><span>Mode</span> <span className="font-bold">{order.printOptions.mode}</span></p>
                                        <p className="flex justify-between text-sm"><span>Sides</span> <span className="font-bold">{order.printOptions.side}</span></p>
                                        <p className="flex justify-between text-sm"><span>Binding</span> <span className="font-bold">{order.printOptions.binding}</span></p>
                                        <p className="flex justify-between text-sm"><span>Copies</span> <span className="font-bold">{order.printOptions.copies}</span></p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">UPLOADED FILES</p>
                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 no-scrollbar">
                                        {order.files.map((file, fIdx) => (
                                            <div key={fIdx} className="flex items-center gap-3 p-2 bg-bg rounded-lg border border-border/50">
                                                <span className="text-lg">📄</span>
                                                <span className="text-xs truncate font-medium flex-1">{file.originalName}</span>
                                                {file.url ? (
                                                    <a href={file.url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[10px] font-bold">VIEW</a>
                                                ) : (
                                                    <span className="text-text-muted text-[10px] font-bold">POS</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-border">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-text-muted font-medium">Total Amount:</p>
                                    <p className="text-2xl font-bold font-outfit text-primary">₹{order.pricing.totalAmount.toFixed(2)}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    {!order.payment.isPaid && (order.status === 'received' || order.status === 'failed') && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const { data } = await axios.post(`/api/order/payment-link/${order._id}`);
                                                    if (data.success) {
                                                        window.open(data.paymentUrl, '_blank');
                                                    } else {
                                                        toast.error(data.message);
                                                    }
                                                } catch (err) {
                                                    toast.error("Failed to generate payment link");
                                                }
                                            }}
                                            className="btn-primary flex-1 md:flex-none py-3 px-6 text-sm bg-orange-600"
                                        >
                                            Pay Now 💳
                                        </button>
                                    )}
                                    <button
                                        onClick={() => window.open(`${axios.defaults.baseURL}/api/order/thermal-bill/${order._id}`, '_blank')}
                                        className="btn-outline flex-1 md:flex-none py-3 px-6 text-sm"
                                    >
                                        Download Invoice
                                    </button>
                                    <button onClick={() => trackOnWA(order)} className="btn-primary flex-1 md:flex-none py-3 px-6 text-sm flex items-center justify-center gap-2">
                                        <span>Track on WA</span>
                                        <span className="bg-white/20 p-0.5 rounded-full text-white">💬</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default MyOrders
