import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const POSMode = () => {
    const { axios } = useAppContext();
    const [customer, setCustomer] = useState({ name: '', phone: '' });
    const [services, setServices] = useState([]);
    const [cart, setCart] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const fetchServices = async () => {
        try {
            const { data } = await axios.get('/api/services');
            if (data.success) setServices(data.services);
        } catch (error) {
            console.error(error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchServices(); }, []);

    const addToCart = (p) => {
        const existingItemIndex = cart.findIndex(item => item._id === p._id);
        if (existingItemIndex > -1) {
            const newCart = [...cart];
            newCart[existingItemIndex].quantity += 1;
            setCart(newCart);
        } else {
            setCart([...cart, { ...p, quantity: 1 }]);
        }
        setTotal(total + (p.price || 0));
    };

    const updateQuantity = (index, delta) => {
        const newCart = [...cart];
        const item = newCart[index];
        if (item.quantity + delta > 0) {
            item.quantity += delta;
            setCart(newCart);
            setTotal(total + (delta * (item.price || 0)));
        } else {
            removeFromCart(index);
        }
    };

    const removeFromCart = (index) => {
        const item = cart[index];
        setCart(cart.filter((_, i) => i !== index));
        setTotal(total - ((item.price || 0) * item.quantity));
    };

    const handleCheckout = async () => {
        if (!customer.phone) return toast.error("Enter customer phone");
        if (cart.length === 0) return toast.error("Cart is empty");

        setLoading(true);
        try {
            const currentBill = {
                customer,
                items: cart,
                totalAmount: total,
                date: new Date(),
                orderNo: `POS-${Date.now().toString().slice(-6)}`
            };

            const { data } = await axios.post('/api/order/pos', {
                customer,
                items: cart,
                totalAmount: total,
                paymentMethod: 'Cash'
            });

            if (data.success) {
                toast.success("POS Bill Generated! 🚀");
                handlePrint({ ...currentBill, orderNo: data.orderId.slice(-8).toUpperCase() });
                setCart([]);
                setTotal(0);
                setCustomer({ name: '', phone: '' });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Billing Failed");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (bill) => {
        const printWindow = window.open('', '_blank');
        const itemsHtml = bill.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="flex: 1;">${item.name} x ${item.quantity}</span>
                <span>₹${item.price * item.quantity}</span>
            </div>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>POS Receipt</title>
                    <style>
                        body { width: 80mm; font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 0; padding: 10px; }
                        .center { text-align: center; }
                        .bold { font-weight: bold; }
                        .header { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                        .footer { border-top: 1px dashed #000; padding-top: 10px; margin-top: 20px; font-size: 10px; }
                        .item-row { margin-bottom: 5px; }
                        @media print { margin: 0; }
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    <div class="header center">
                        <div class="bold" style="font-size: 16px;">PRINT EXPRESS</div>
                        <div>Official Receipt</div>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <div>Date: ${new Date(bill.date).toLocaleString()}</div>
                        <div>Order No: ${bill.orderNo}</div>
                        <div>Customer: ${bill.customer.name || 'Walk-in'}</div>
                        <div>Phone: ${bill.customer.phone}</div>
                    </div>

                    <div style="border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 5px; font-weight: bold;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Service</span>
                            <span>Price</span>
                        </div>
                    </div>

                    ${itemsHtml}

                    <div style="border-top: 1px solid #000; margin-top: 10px; padding-top: 5px; font-weight: bold;">
                        <div style="display: flex; justify-content: space-between; font-size: 14px;">
                            <span>TOTAL PAID</span>
                            <span>₹${bill.totalAmount}</span>
                        </div>
                        <div class="center" style="margin-top: 5px; font-size: 10px;">(Paid by Cash)</div>
                    </div>

                    <div class="footer center">
                        <div class="bold">Thank you for visiting!</div>
                        <div>Visit again for all your printing needs</div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (fetching) return <div className="p-8 text-center text-text-muted">Loading POS Services...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Product Selection */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold font-outfit">Quick Billing (POS)</h2>
                    <div className="flex gap-2 flex-1 max-w-md">
                        <input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="Phone" className="input-field py-2" />
                        <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Customer Name" className="input-field py-2" />
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-2 no-scrollbar">
                    {services.map((p, i) => (
                        <button key={i} onClick={() => addToCart(p)} className="card-premium p-6 flex flex-col items-center gap-3 hover:border-primary/60 transition-all group relative active:scale-95">
                            <span className="text-3xl transition-transform group-hover:scale-110">{p.icon || '📄'}</span>
                            <div className="text-center">
                                <p className="font-bold text-xs truncate w-full">{p.name}</p>
                                <p className="text-[10px] text-primary font-bold mt-1">₹{p.price}</p>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">+ ADD</span>
                            </div>
                        </button>
                    ))}
                    {services.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-2xl">
                            <p className="text-text-muted text-sm">No services found. Add them in Print Services.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Summary */}
            <div className="card-premium flex flex-col h-[calc(100vh-140px)] sticky top-0 bg-white shadow-xl border-2 border-blue-50">
                <h3 className="text-lg font-bold font-outfit mb-6 flex items-center justify-between border-b border-border pb-4">
                    Current Bill
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{cart.length} items</span>
                </h3>

                <div className="flex-1 space-y-3 overflow-y-auto mb-6 pr-2 no-scrollbar">
                    {cart.map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-border/40 hover:border-primary/30 transition-colors animate-in slide-in-from-right-2 duration-200">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{item.icon || '📄'}</span>
                                <div>
                                    <p className="text-xs font-bold line-clamp-1">{item.name}</p>
                                    <p className="text-[10px] text-primary font-bold">₹{item.price} × {item.quantity}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-white rounded-lg border border-border px-1">
                                    <button onClick={() => updateQuantity(i, -1)} className="p-1 hover:text-primary">－</button>
                                    <span className="text-xs font-bold px-2 min-w-[24px] text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(i, 1)} className="p-1 hover:text-primary">＋</button>
                                </div>
                                <button onClick={() => removeFromCart(i)} className="text-red-400 hover:text-red-600 text-xs p-2">✕</button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-40 py-10">
                            <span className="text-4xl mb-4">🛒</span>
                            <p className="text-xs font-medium">Cart is empty</p>
                        </div>
                    )}
                </div>

                <div className="space-y-3 pt-6 border-t-2 border-slate-100">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-text-muted">Subtotal</span>
                        <span>₹{total}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-text-muted">Tax (0%)</span>
                        <span className="text-green-600 font-bold">FREE</span>
                    </div>
                    <div className="pt-4 mt-2">
                        <div className="flex justify-between items-end pb-4">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Total Payable</span>
                            <span className="text-3xl font-bold font-outfit text-primary">₹{total}</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={loading || cart.length === 0}
                            className="btn-primary w-full py-5 text-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'COMPLETE ORDER ⚡'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <button className="py-2 border border-border rounded-lg text-[10px] font-bold text-text-muted hover:bg-slate-50">Thermal Print 🖨️</button>
                        <button className="py-2 border border-border rounded-lg text-[10px] font-bold text-text-muted hover:bg-slate-50">Save Quote 📄</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POSMode;
