import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const Orders = () => {
    const { axios } = useAppContext()
    const [orders, setOrders] = useState([])

    const fetchOrders = async () => {
        try {
            const { data } = await axios.get('/api/order/all');
            if (data.success) {
                setOrders(data.orders)
            }
        } catch (error) {
            console.error(error.message)
        }
    };

    const updateStatus = async (orderId, status) => {
        try {
            const { data } = await axios.post('/api/order/update-status', { orderId, status });
            if (data.success) {
                toast.success("Status Updated");
                fetchOrders();
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'received': return 'bg-blue-100 text-blue-600';
            case 'printing': return 'bg-yellow-100 text-yellow-600';
            case 'ready': return 'bg-purple-100 text-purple-600';
            case 'delivered': return 'bg-green-100 text-green-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    }

    const sendWANotification = (order) => {
        const phone = order.deliveryDetails.phone;
        const message = `Hello! Your Print Express order #${order._id.slice(-8).toUpperCase()} is now ${order.status.toUpperCase()}. Thank you!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }

    useEffect(() => {
        fetchOrders();
    }, [])


    return (
        <div className='space-y-8'>
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-outfit">Manage Print Orders</h2>
                <div className="flex gap-2">
                    <button onClick={fetchOrders} className="px-4 py-2 bg-white border border-border rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">Refresh 🔄</button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold">Export CSV</button>
                </div>
            </div>

            <div className="space-y-4">
                {orders.map((order, index) => (
                    <div key={index} className="card-premium p-6 flex flex-col md:flex-row gap-8 justify-between hover:border-primary/50 transition-colors">
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                                <span className="font-outfit font-bold text-lg">#{order._id?.slice(-8).toUpperCase() || 'N/A'}</span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="text-sm space-y-1">
                                {order.fulfillment?.method === 'pickup' ? (
                                    <p className="font-bold text-green-600">🏪 STORE PICKUP</p>
                                ) : (
                                    <>
                                        <p className="font-bold">{order.deliveryDetails?.address || 'No Address'}</p>
                                        <p className="text-text-muted">{order.deliveryDetails?.pincode}, {order.deliveryDetails?.district}</p>
                                    </>
                                )}
                                <p className="text-primary font-bold">📞 {order.deliveryDetails?.phone || order.userId?.phone || "No Phone"}</p>
                            </div>
                        </div>

                        <div className="space-y-3 flex-1 border-l border-border pl-8">
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">ORDER CONTENT</p>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">{order.printOptions.mode} | {order.printOptions.side} | {order.printOptions.binding}</p>
                                <div className="flex flex-wrap gap-2">
                                    {order.files.map((file, fIdx) => (
                                        file.url ? (
                                            <a key={fIdx} href={file.url} target="_blank" rel="noreferrer" className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-primary hover:bg-primary hover:text-white transition-colors">VIEW {fIdx + 1}</a>
                                        ) : (
                                            <span key={fIdx} className="px-2 py-1 bg-slate-50 rounded text-[10px] font-bold text-text-muted border border-border">POS ITEM</span>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 flex-1 text-right border-l border-border pl-8 flex flex-col justify-between">
                            <div>
                                <p className="text-2xl font-bold font-outfit text-primary">₹{(order.pricing?.totalAmount || 0).toFixed(2)}</p>
                                <p className="text-[10px] text-text-muted font-bold uppercase">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <select
                                    value={order.status}
                                    onChange={(e) => updateStatus(order._id, e.target.value)}
                                    className="bg-slate-50 border border-border rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary"
                                >
                                    <option value="received">Mark Received</option>
                                    <option value="printing">Mark Printing</option>
                                    <option value="ready">Mark Ready</option>
                                    <option value="delivered">Mark Delivered</option>
                                </select>
                                <button onClick={() => sendWANotification(order)} className="text-primary font-bold text-[10px] hover:underline">SEND WA NOTIFICATION 🔗</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Orders
