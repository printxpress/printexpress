import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import PrintExpressLogo from '../components/PrintExpressLogo';
import PrintingAnimation from '../components/PrintingAnimation';
import { detectDocument, formatFileSize, getDocumentIcon } from '../utils/documentDetection';

const PrintPage = () => {
    const { axios, user } = useAppContext();
    const [files, setFiles] = useState([]);
    const [fileMetadata, setFileMetadata] = useState([]);
    const [options, setOptions] = useState({
        mode: 'B/W',
        side: 'Single',
        copies: 1,
        binding: 'None'
    });
    const [delivery, setDelivery] = useState({
        pincode: '',
        address: '',
        district: '',
        state: '',
        landmark: '',
        phone: ''
    });
    const [pricing, setPricing] = useState({
        print: 0,
        binding: 0,
        delivery: 40,
        couponDiscount: 0,
        walletUsed: 0,
        total: 0
    });

    // New state for features
    const [fulfillment, setFulfillment] = useState('delivery');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [useWallet, setUseWallet] = useState(false);

    const [loading, setLoading] = useState(false);
    const [processingFiles, setProcessingFiles] = useState(false);
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [pincodeError, setPincodeError] = useState('');

    const [rules, setRules] = useState({
        printing: { bw: { single: 2, double: 3 }, color: { single: 10, double: 15 } },
        additional: { binding: 50, hard_binding: 200, handling_fee: 10 },
        delivery: 40
    });

    // Fetch wallet balance and pricing rules on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [walletRes, pricingRes] = await Promise.all([
                    axios.get('/api/wallet/balance'),
                    axios.get('/api/pricing')
                ]);
                if (walletRes.data.success) setWalletBalance(walletRes.data.balance);
                if (pricingRes.data.success) {
                    const r = pricingRes.data.pricing.rules;
                    setRules({
                        printing: r.printing || rules.printing,
                        additional: r.additional || rules.additional,
                        delivery: 40 // Default or from another settings
                    });
                }
            } catch (e) { }
        };
        fetchData();
    }, [user]);

    useEffect(() => {
        const totalPages = fileMetadata.reduce((sum, meta) => sum + (meta.pageCount || 0), 0);

        const isColor = options.mode === 'Color';
        const isDouble = options.side === 'Double';
        const rate = isColor
            ? (isDouble ? rules.printing.color.double : rules.printing.color.single)
            : (isDouble ? rules.printing.bw.double : rules.printing.bw.single);

        const printCharge = totalPages * rate * options.copies;
        const bindCharge = options.binding === 'Spiral' ? rules.additional.binding : (options.binding === 'Staple' ? 10 : (options.binding === 'Hard' ? rules.additional.hard_binding : 0));
        const deliveryCharge = fulfillment === 'pickup' ? 0 : rules.delivery;
        const subtotal = printCharge + bindCharge + deliveryCharge;
        const couponDiscount = couponApplied?.discount || 0;
        const afterCoupon = Math.max(0, subtotal - couponDiscount);
        const walletUsed = useWallet ? Math.min(walletBalance, afterCoupon) : 0;
        const total = afterCoupon - walletUsed;

        setPricing({
            print: printCharge,
            binding: bindCharge,
            delivery: deliveryCharge,
            couponDiscount,
            walletUsed,
            total
        });
    }, [fileMetadata, options, fulfillment, couponApplied, useWallet, walletBalance]);

    const handlePincodeChange = async (pincode) => {
        setDelivery(prev => ({ ...prev, pincode }));
        setPincodeError('');
        if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
            setPincodeLoading(true);
            try {
                const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
                const data = await response.json();
                if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
                    const postOffice = data[0].PostOffice[0];
                    setDelivery(prev => ({
                        ...prev,
                        district: postOffice.District || '',
                        state: postOffice.State || '',
                    }));
                    toast.success(`📍 Detected: ${postOffice.District}, ${postOffice.State}`);
                } else {
                    setPincodeError('Invalid pincode - please check');
                    setDelivery(prev => ({ ...prev, district: '', state: '' }));
                }
            } catch (error) {
                setPincodeError('Could not verify pincode');
            } finally {
                setPincodeLoading(false);
            }
        } else if (pincode.length > 0 && pincode.length < 6) {
            setDelivery(prev => ({ ...prev, district: '', state: '' }));
        }
    };

    const handleFileChange = async (e) => {
        const uploaded = Array.from(e.target.files);
        setProcessingFiles(true);
        const validFiles = [];
        const metadata = [];
        for (const file of uploaded) {
            const meta = await detectDocument(file);
            if (meta.isValid) {
                validFiles.push(file);
                metadata.push(meta);
                toast.success(`✅ ${meta.name}: ${meta.type} (${meta.pageCount} page${meta.pageCount > 1 ? 's' : ''})`);
            } else {
                toast.error(`❌ ${file.name}: ${meta.error}`);
            }
        }
        setFiles(prev => [...prev, ...validFiles]);
        setFileMetadata(prev => [...prev, ...metadata]);
        setProcessingFiles(false);
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, idx) => idx !== index));
        setFileMetadata(fileMetadata.filter((_, idx) => idx !== index));
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return toast.error('Enter a coupon code');
        setCouponLoading(true);
        try {
            const subtotal = pricing.print + pricing.binding + pricing.delivery;
            const { data } = await axios.post('/api/coupon/validate', {
                code: couponCode,
                orderAmount: subtotal
            });
            if (data.success) {
                setCouponApplied({ code: data.coupon.code, discount: data.discount });
                toast.success(`🎉 Coupon applied! ₹${data.discount} off`);
            } else {
                toast.error(data.message);
                setCouponApplied(null);
            }
        } catch (e) { toast.error('Failed to validate coupon'); }
        finally { setCouponLoading(false); }
    };

    const removeCoupon = () => {
        setCouponApplied(null);
        setCouponCode('');
    };

    const handlePlaceOrder = async () => {
        if (!user) return toast.error("Please login to place order");
        if (files.length === 0) return toast.error("Please upload at least one document");
        if (fulfillment === 'delivery' && !delivery.address) return toast.error("Please enter delivery address");
        if (fulfillment === 'delivery' && !delivery.pincode) return toast.error("Please enter pincode");

        setLoading(true);
        try {
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));
            formData.append('data', JSON.stringify({
                userId: user._id || user.id,
                printOptions: options,
                fulfillment: {
                    method: fulfillment,
                    pickupLocation: fulfillment === 'pickup' ? 'Print Express Store, Coimbatore' : undefined
                },
                deliveryDetails: fulfillment === 'delivery' ? delivery : undefined,
                paymentMethod,
                couponCode: couponApplied?.code || '',
                couponDiscount: pricing.couponDiscount,
                walletUsed: pricing.walletUsed,
                fileMetadata
            }));

            const { data } = await axios.post('/api/order/print', formData);
            if (data.success) {
                toast.success("Order Placed Successfully! 🎉");
                setFiles([]);
                setFileMetadata([]);
                setCouponApplied(null);
                setCouponCode('');
                setUseWallet(false);
                if (pricing.walletUsed > 0) {
                    const walletRes = await axios.get('/api/wallet/balance');
                    if (walletRes.data.success) setWalletBalance(walletRes.data.balance);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Error placing order");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <PrintingAnimation />;
    }

    const totalPages = fileMetadata.reduce((sum, meta) => sum + (meta.pageCount || 0), 0);

    return (
        <div className="py-12 max-w-6xl mx-auto space-y-12">
            {/* Header with Logo */}
            <div className="text-center space-y-4">
                <div className="flex justify-center mb-4">
                    <PrintExpressLogo />
                </div>
                <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-orange-100 text-blue-800 rounded-full text-sm font-bold uppercase tracking-wider inline-block">
                    Fast & Reliable Printing Services 🚀
                </span>
                <h1 className="text-4xl md:text-5xl font-bold font-outfit bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
                    Send for Printing
                </h1>
                <p className="text-text-muted text-lg">Upload your documents and choose your preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Wizard Steps */}
                <div className="lg:col-span-2 space-y-8">
                    {/* 1. Upload Files */}
                    <div className="card-premium space-y-6 border-2 border-blue-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold font-outfit flex items-center gap-2">
                                <span className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-full flex items-center justify-center text-sm">1</span>
                                Upload Documents
                            </h3>
                            {processingFiles && <span className="text-sm text-blue-600 animate-pulse">Processing...</span>}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <label className="border-2 border-dashed border-blue-300 rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all group">
                                <span className="text-4xl group-hover:scale-110 transition-transform">📄</span>
                                <span className="text-xs font-semibold text-center">PDF Document</span>
                                <input type="file" className="hidden" multiple accept=".pdf,application/pdf" onChange={handleFileChange} />
                            </label>
                            <label className="border-2 border-dashed border-orange-300 rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-orange-50 hover:border-orange-500 transition-all group">
                                <span className="text-4xl group-hover:scale-110 transition-transform">🖼️</span>
                                <span className="text-xs font-semibold text-center">Images</span>
                                <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                            </label>
                            <label className="border-2 border-dashed border-green-300 rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-green-50 hover:border-green-500 transition-all group">
                                <span className="text-4xl group-hover:scale-110 transition-transform">🪪</span>
                                <span className="text-xs font-semibold text-center">ID Cards</span>
                                <input type="file" className="hidden" multiple accept=".pdf,image/*" onChange={handleFileChange} />
                            </label>
                        </div>

                        {fileMetadata.length > 0 && (
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-blue-800">Uploaded Documents</span>
                                    <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full">
                                        {totalPages} page{totalPages !== 1 ? 's' : ''} total
                                    </span>
                                </div>
                                {fileMetadata.map((meta, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-blue-100">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className="text-2xl">{getDocumentIcon(meta.type, meta.subType)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">{meta.name}</p>
                                                <div className="flex gap-2 text-xs text-text-muted">
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{meta.type}</span>
                                                    {meta.subType && (
                                                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">{meta.subType}</span>
                                                    )}
                                                    <span>{meta.pageCount} page{meta.pageCount > 1 ? 's' : ''}</span>
                                                    <span>{formatFileSize(meta.size)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFile(i)}
                                            className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Print Options */}
                    <div className="card-premium space-y-6 border-2 border-blue-100">
                        <h3 className="text-xl font-bold font-outfit flex items-center gap-2">
                            <span className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-full flex items-center justify-center text-sm">2</span>
                            Print Options
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-muted">Printing Mode</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setOptions({ ...options, mode: 'B/W' })}
                                        className={`flex-1 py-3 rounded-xl border-2 transition-all font-semibold ${options.mode === 'B/W'
                                            ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white border-blue-800 shadow-lg'
                                            : 'bg-white border-border hover:border-blue-500'
                                            }`}
                                    >
                                        B/W Print
                                    </button>
                                    <button
                                        onClick={() => setOptions({ ...options, mode: 'Color' })}
                                        className={`flex-1 py-3 rounded-xl border-2 transition-all font-semibold ${options.mode === 'Color'
                                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-600 shadow-lg'
                                            : 'bg-white border-border hover:border-orange-500'
                                            }`}
                                    >
                                        Color Print
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-muted">Print Side</label>
                                <select value={options.side} onChange={(e) => setOptions({ ...options, side: e.target.value })} className="input-field">
                                    <option value="Single">Single Sided</option>
                                    <option value="Double">Double Sided (Duplex)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-muted">Copies</label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setOptions({ ...options, copies: Math.max(1, options.copies - 1) })}
                                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 flex items-center justify-center font-bold text-blue-800 transition-all"
                                    >
                                        −
                                    </button>
                                    <span className="text-2xl font-bold w-12 text-center">{options.copies}</span>
                                    <button
                                        onClick={() => setOptions({ ...options, copies: options.copies + 1 })}
                                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 flex items-center justify-center font-bold text-blue-800 transition-all"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-muted">Binding</label>
                                <select value={options.binding} onChange={(e) => setOptions({ ...options, binding: e.target.value })} className="input-field">
                                    <option value="None">No Binding</option>
                                    <option value="Spiral">Spiral Binding (+₹{rules.additional.binding})</option>
                                    <option value="Staple">Staple Binding (+₹10)</option>
                                    <option value="Hard">Hard Binding (+₹{rules.additional.hard_binding})</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 3. Fulfillment Method */}
                    <div className="card-premium space-y-6 border-2 border-blue-100">
                        <h3 className="text-xl font-bold font-outfit flex items-center gap-2">
                            <span className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-full flex items-center justify-center text-sm">3</span>
                            How Would You Like to Receive?
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setFulfillment('delivery')}
                                className={`p-5 rounded-2xl border-2 transition-all text-left space-y-2 ${fulfillment === 'delivery'
                                    ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                                    : 'border-border hover:border-blue-300'}`}
                            >
                                <span className="text-3xl">🚚</span>
                                <p className="font-bold">Home Delivery</p>
                                <p className="text-xs text-text-muted">Delivered to your doorstep</p>
                                <p className="text-xs font-bold text-blue-600">+₹{rules.delivery}</p>
                            </button>
                            <button
                                onClick={() => setFulfillment('pickup')}
                                className={`p-5 rounded-2xl border-2 transition-all text-left space-y-2 ${fulfillment === 'pickup'
                                    ? 'border-green-600 bg-green-50 shadow-lg shadow-green-100'
                                    : 'border-border hover:border-green-300'}`}
                            >
                                <span className="text-3xl">🏪</span>
                                <p className="font-bold">Store Pickup</p>
                                <p className="text-xs text-text-muted">Collect from our store</p>
                                <p className="text-xs font-bold text-green-600">FREE</p>
                            </button>
                        </div>

                        {fulfillment === 'delivery' ? (
                            <div className="grid grid-cols-1 gap-4 pt-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted">SHIPPING PINCODE</label>
                                    <div className="relative">
                                        <input
                                            value={delivery.pincode}
                                            onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="641001"
                                            className={`input-field pr-10 ${pincodeError ? 'border-red-400' : delivery.district ? 'border-green-400' : ''}`}
                                            maxLength={6}
                                            inputMode="numeric"
                                        />
                                        {pincodeLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                        {delivery.district && !pincodeLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-lg">✓</div>
                                        )}
                                    </div>
                                    {pincodeError && <p className="text-xs text-red-500">{pincodeError}</p>}
                                    {delivery.district && (
                                        <p className="text-xs text-green-600 font-medium">📍 {delivery.district}, {delivery.state}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-text-muted">DISTRICT</label>
                                        <input value={delivery.district} readOnly placeholder="Auto-detected" className="input-field bg-slate-50 cursor-not-allowed" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-text-muted">STATE</label>
                                        <input value={delivery.state} readOnly placeholder="Auto-detected" className="input-field bg-slate-50 cursor-not-allowed" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted">PHONE NUMBER</label>
                                    <input value={delivery.phone} onChange={(e) => setDelivery({ ...delivery, phone: e.target.value })} placeholder="+91 9876543210" className="input-field" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted">FULL DELIVERY ADDRESS</label>
                                    <textarea value={delivery.address} onChange={(e) => setDelivery({ ...delivery, address: e.target.value })} placeholder="House No, Street Name, Area..." className="input-field h-24" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted">LANDMARK (Optional)</label>
                                    <input value={delivery.landmark} onChange={(e) => setDelivery({ ...delivery, landmark: e.target.value })} placeholder="Near bus stop, temple, etc." className="input-field" />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50 p-5 rounded-xl border border-green-200 space-y-2">
                                <p className="font-bold text-green-800">📍 Pickup Location</p>
                                <p className="text-sm text-green-700">Print Express Store</p>
                                <p className="text-xs text-green-600">Coimbatore, Tamil Nadu</p>
                                <p className="text-xs text-text-muted mt-2">You will receive a notification when your order is ready for pickup.</p>
                            </div>
                        )}
                    </div>

                    {/* 4. Payment Method */}
                    <div className="card-premium space-y-6 border-2 border-blue-100">
                        <h3 className="text-xl font-bold font-outfit flex items-center gap-2">
                            <span className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-full flex items-center justify-center text-sm">4</span>
                            Payment Method
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { id: 'COD', icon: '💵', label: 'Cash on Delivery', desc: 'Pay when you receive' },
                                { id: 'UPI', icon: '📱', label: 'UPI Payment', desc: 'Google Pay, PhonePe' },
                                { id: 'Wallet', icon: '🪙', label: 'Wallet', desc: `Balance: ₹${walletBalance}` },
                                { id: 'UPI+Wallet', icon: '💳', label: 'UPI + Wallet', desc: 'Split payment' },
                            ].map(pm => (
                                <button
                                    key={pm.id}
                                    onClick={() => {
                                        setPaymentMethod(pm.id);
                                        if (pm.id === 'Wallet' || pm.id === 'UPI+Wallet') setUseWallet(true);
                                        else setUseWallet(false);
                                    }}
                                    disabled={pm.id === 'Wallet' && walletBalance <= 0}
                                    className={`p-4 rounded-xl border-2 transition-all text-left space-y-1 ${paymentMethod === pm.id
                                        ? 'border-blue-600 bg-blue-50 shadow-md'
                                        : 'border-border hover:border-blue-300'
                                        } ${pm.id === 'Wallet' && walletBalance <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                    <span className="text-2xl">{pm.icon}</span>
                                    <p className="font-bold text-sm">{pm.label}</p>
                                    <p className="text-[10px] text-text-muted">{pm.desc}</p>
                                </button>
                            ))}
                        </div>

                        {/* Wallet Balance Info */}
                        {useWallet && walletBalance > 0 && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🪙</span>
                                    <div>
                                        <p className="font-bold text-sm text-amber-800">Wallet Coins</p>
                                        <p className="text-xs text-amber-600">Available: ₹{walletBalance}</p>
                                    </div>
                                </div>
                                <p className="text-lg font-bold text-green-600">-₹{pricing.walletUsed}</p>
                            </div>
                        )}

                        {/* Coupon Code */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-text-muted">🎟️ Have a Coupon Code?</label>
                            {couponApplied ? (
                                <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🎉</span>
                                        <div>
                                            <p className="font-bold text-green-800">{couponApplied.code}</p>
                                            <p className="text-xs text-green-600">₹{couponApplied.discount} discount applied!</p>
                                        </div>
                                    </div>
                                    <button onClick={removeCoupon} className="text-red-500 text-xs font-bold hover:text-red-700">Remove</button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        value={couponCode}
                                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="Enter coupon code"
                                        className="input-field flex-1 font-mono uppercase"
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={couponLoading}
                                        className="btn-primary px-6 py-3 text-sm whitespace-nowrap"
                                    >
                                        {couponLoading ? '...' : 'Apply'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Order Summary */}
                <div className="space-y-6">
                    <div className="card-premium p-8 sticky top-24 space-y-6 border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50">
                        <h4 className="text-xl font-bold font-outfit text-center bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">Order Summary</h4>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted">Documents Uploaded</span>
                                <span className="font-bold text-blue-800">{files.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted">Total Pages</span>
                                <span className="font-bold text-blue-800">{totalPages}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted">Printing Charge</span>
                                <span className="font-bold">₹{pricing.print.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted">Binding Charge</span>
                                <span className="font-bold">₹{pricing.binding.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted">{fulfillment === 'pickup' ? 'Pickup (Free)' : 'Courier Charge'}</span>
                                <span className={`font-bold ${fulfillment === 'pickup' ? 'text-green-600' : ''}`}>
                                    {fulfillment === 'pickup' ? 'FREE' : `₹${pricing.delivery.toFixed(2)}`}
                                </span>
                            </div>

                            {pricing.couponDiscount > 0 && (
                                <div className="flex justify-between items-center text-green-600">
                                    <span className="font-medium">🎟️ Coupon Discount</span>
                                    <span className="font-bold">-₹{pricing.couponDiscount.toFixed(2)}</span>
                                </div>
                            )}

                            {pricing.walletUsed > 0 && (
                                <div className="flex justify-between items-center text-amber-600">
                                    <span className="font-medium">🪙 Wallet Coins</span>
                                    <span className="font-bold">-₹{pricing.walletUsed.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="pt-6 border-t-2 border-blue-200 flex justify-between items-center">
                                <span className="text-lg font-bold">Amount to Pay</span>
                                <span className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-orange-600 bg-clip-text text-transparent font-outfit">₹{pricing.total.toFixed(2)}</span>
                            </div>

                            <div className="text-center">
                                <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                    {paymentMethod === 'COD' && '💵 Cash on Delivery'}
                                    {paymentMethod === 'UPI' && '📱 UPI Payment'}
                                    {paymentMethod === 'Wallet' && '🪙 Wallet Payment'}
                                    {paymentMethod === 'UPI+Wallet' && '💳 UPI + Wallet'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading || files.length === 0}
                            className="w-full py-5 text-xl font-bold rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-xl shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Processing...' : 'Place Order 🚀'}
                        </button>
                        <p className="text-[10px] text-center text-text-muted">* Final amount calculated after internal review</p>
                    </div>

                    <div className="card-premium p-6 flex flex-col items-center text-center space-y-2 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                        <p className="text-sm font-bold text-orange-800">💡 Need Help?</p>
                        <p className="text-xs text-text-muted">Confused about sides or binding? Chat with us on WhatsApp for instant assistance.</p>
                        <button className="text-orange-600 font-bold text-sm mt-2 flex items-center gap-2 hover:text-orange-700">WhatsApp Support 🔗</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintPage;
