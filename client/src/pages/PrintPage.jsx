import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import PrintExpressLogo from '../components/PrintExpressLogo';
import PrintingAnimation from '../components/PrintingAnimation';
import { detectDocument, formatFileSize, getDocumentIcon } from '../utils/documentDetection';

const PrintPage = () => {
    const { axios, user, services } = useAppContext();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [fileMetadata, setFileMetadata] = useState([]);
    const [options, setOptions] = useState({
        mode: 'B/W',
        side: 'Single',
        paperSize: 'A4',
        copies: 1,
        binding: 'None',
        orientation: 'Portrait',
        layout: 'Full',
        bindingQuantity: 1,
        pageRangeType: 'All', // 'All' or 'Custom'
        customPages: '', // e.g., '1-5, 10, 12-15'
        notes: '',
        pagesPerSheet: 1 // 1 or 2
    });
    const [step, setStep] = useState(1);

    // Smart Binding Logic
    useEffect(() => {
        if (options.copies >= 20 && options.binding === 'None') {
            setOptions(prev => ({ ...prev, binding: 'Spiral', bindingQuantity: options.copies }));
            toast("📦 Large order! Automatically added Spiral Binding for you.", {
                icon: '💡',
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });
        } else if (options.binding !== 'None') {
            // Sync binding quantity with copies
            setOptions(prev => ({ ...prev, bindingQuantity: options.copies }));
        }
    }, [options.copies, options.binding]);

    const [stepLoading, setStepLoading] = useState(false);
    const [delivery, setDelivery] = useState({
        pincode: searchParams.get('pincode') || '',
        address: '',
        district: searchParams.get('district') || '',
        state: searchParams.get('state') || '',
        landmark: '',
        phone: '',
        weight: 1
    });
    const [pricing, setPricing] = useState({
        basePrint: 0,
        sideDiscount: 0,
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
    const [isEditingAddress, setIsEditingAddress] = useState(false); // To toggle address edit mode

    const [rules, setRules] = useState({
        printing: {
            bw: { single: 0.75, double: 0.5, a3_single: 2, a3_double: 1.5 },
            color: { single: 8, double: 8, a3_single: 20, a3_double: 20 }
        },
        additional: { binding: 15, chart_binding: 10, hard_binding: 200, handling_fee: 10 },
        delivery_tiers: {
            tier_a: { maxWeight: 3, rate: 35, slip: 0 },
            tier_b: { maxWeight: 10, rate: 29, slip: 20 },
            tier_c: { maxWeight: 999, rate: 26, slip: 20 }
        }
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
                        delivery_tiers: r.delivery_tiers || rules.delivery_tiers
                    });
                }
            } catch (e) { }
        };
        fetchData();
    }, [user]);

    // Auto-fill address from user profile
    useEffect(() => {
        if (user && user.address && fulfillment === 'delivery') {
            setDelivery(prev => ({
                ...prev,
                pincode: user.address.pincode || prev.pincode,
                address: user.address.line1 || prev.address,
                district: user.address.city || prev.district,
                state: user.address.state || prev.state,
                landmark: user.address.landmark || prev.landmark,
                phone: user.phone || prev.phone
            }));
            // If address exists, default to 'view' mode (not editing)
            if (user.address.line1) setIsEditingAddress(false);
            else setIsEditingAddress(true);
        } else {
            setIsEditingAddress(true);
        }
    }, [user, fulfillment]);

    const calculateCustomPageCount = (range) => {
        if (!range) return 0;
        const parts = range.split(',').map(p => p.trim());
        let count = 0;
        parts.forEach(part => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end) && end >= start) {
                    count += (end - start + 1);
                }
            } else {
                const num = Number(part);
                if (!isNaN(num) && num > 0) count += 1;
            }
        });
        return count;
    };

    useEffect(() => {
        const docPages = fileMetadata.reduce((sum, meta) => sum + (meta.pageCount || 0), 0);
        const totalPages = options.pageRangeType === 'All' ? docPages : calculateCustomPageCount(options.customPages);

        // Effective pages considering 'Times per sheet' (1 or 2)
        const effectivePages = options.pagesPerSheet === 2 ? Math.ceil(totalPages / 2) : totalPages;

        const isColor = options.mode === 'Color';
        const isDouble = options.side === 'Double';
        const isA3 = options.paperSize === 'A3';

        // Dynamic Pricing Integration
        const serviceName = isColor ? "Color A4 Print" : "B/W A4 Print";
        const matchingService = services.find(s => s.name === serviceName);

        // Base rate logic (Dynamic or Rule-based)
        let rate;
        const colorKey = isColor ? 'color' : 'bw';
        const sideKey = isDouble ? 'double' : 'single';
        const a3SideKey = isDouble ? 'a3_double' : 'a3_single';

        if (matchingService) {
            rate = Number(matchingService.price);
            if (isDouble) {
                const multiplier = (rules.printing[colorKey].double / rules.printing[colorKey].single) || 1;
                rate *= multiplier;
            }
            if (isA3) rate *= 2;
        } else {
            if (isA3) {
                rate = rules.printing[colorKey][a3SideKey] || (rules.printing[colorKey][sideKey] * 2);
            } else {
                rate = rules.printing[colorKey][sideKey];
            }
        }

        const printingCharge = effectivePages * rate * options.copies;
        const billingSheets = isDouble ? Math.ceil(effectivePages / 2) : effectivePages;
        const printCharge = printingCharge;

        let bindBase = 0;
        if (options.binding === 'Spiral') bindBase = rules.additional?.binding || 15;
        else if (options.binding === 'Chart') bindBase = rules.additional?.chart_binding || 10;

        const bindCharge = bindBase * (options.bindingQuantity || 1);

        // Tiered Delivery Logic (Deferred until Step 4 and Pincode provided)
        let deliveryCharge = 0;
        const isLastStage = step === 4;
        const hasValidPincode = delivery.pincode && delivery.pincode.length === 6;

        let bindWeight = 0;
        if (options.binding === 'Spiral') bindWeight = 0.1 * (options.bindingQuantity || 1);
        else if (options.binding === 'Chart') bindWeight = 0.05 * (options.bindingQuantity || 1);

        const totalSheets = billingSheets * options.copies;
        const calcWeight = (totalSheets * 5 / 1000) + bindWeight;

        // Tiered Delivery Logic (Dynamic from DB)
        // Tiered Delivery Logic (Dynamic from DB)
        if (fulfillment === 'delivery' && hasValidPincode && rules.delivery_tiers) {
            const tiers = rules.delivery_tiers;
            let rule = tiers.tier_c; // Default to highest tier

            if (calcWeight <= tiers.tier_a.maxWeight) {
                rule = tiers.tier_a;
            } else if (calcWeight <= tiers.tier_b.maxWeight) {
                rule = tiers.tier_b;
            }

            deliveryCharge = (Number(rule.rate || 0) * calcWeight) + (Number(rule.slip || 0));
        }

        const subtotal = printCharge + bindCharge + deliveryCharge;
        const couponDiscount = couponApplied?.discount || 0;
        const afterCoupon = Math.max(0, subtotal - couponDiscount);
        const walletUsed = useWallet ? Math.min(walletBalance, afterCoupon) : 0;
        const total = afterCoupon - walletUsed;

        setPricing({
            basePrint: printingCharge,
            sideDiscount: 0,
            print: printingCharge,
            binding: bindCharge,
            delivery: deliveryCharge,
            couponDiscount,
            walletUsed,
            total,
            weight: calcWeight
        });
    }, [fileMetadata, options, fulfillment, couponApplied, useWallet, walletBalance, rules, services, step, delivery.pincode]);

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
                    if (!postOffice.Pincode.startsWith('6')) {
                        setPincodeError('Service only available in Tamil Nadu (Pincodes starting with 6)');
                        setDelivery(prev => ({ ...prev, district: '', state: '' }));
                        return;
                    }
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
                setStep(1);
                navigate('/order-success?orderId=' + data.orderId);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Order Placement Error:", error);
            const errorMsg = error.response?.data?.message || error.message || "Error placing order";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && files.length === 0) return toast.error("Please upload at least one document");
        if (step === 3 && fulfillment === 'delivery' && !delivery.address) return toast.error("Please enter delivery address");

        setStepLoading(true);
        setTimeout(() => {
            setStep(prev => prev + 1);
            setStepLoading(false);
            window.scrollTo(0, 0);
        }, 1000);
    };

    const prevStep = () => {
        setStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    if (loading || stepLoading) {
        return <PrintingAnimation message={stepLoading ? "Moving to next step..." : "Processing your order..."} />;
    }

    const docPages = fileMetadata.reduce((sum, meta) => sum + (meta.pageCount || 0), 0);
    const totalPages = options.pageRangeType === 'All' ? docPages : calculateCustomPageCount(options.customPages);

    return (
        <div className="py-12 max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold font-outfit bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
                    {step === 1 && "Upload Documents"}
                    {step === 2 && "Print Options"}
                    {step === 3 && "Delivery Details"}
                    {step === 4 && "Order Summary"}
                </h1>
                <p className="text-text-muted text-lg">
                    {step === 1 && "Upload your documents and choose your preferences"}
                    {step === 2 && "Tailor your printing exactly how you need it"}
                    {step === 3 && "Tell us where to send your prints"}
                    {step === 4 && "Review and finalize your order"}
                </p>

                {/* Step Indicator */}
                <div className="flex justify-center items-center gap-4 mt-8">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-100 text-blue-400'}`}>
                                {s}
                            </div>
                            {s < 4 && <div className={`w-12 h-1 ${step > s ? 'bg-blue-600' : 'bg-blue-100'}`}></div>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
                {/* 1. Sidebar/Top Order Summary */}
                <div className="order-first lg:order-last lg:col-span-1 space-y-6">
                    <div className="card-premium p-6 lg:sticky lg:top-24 sticky top-0 z-10 space-y-6 border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50 shadow-xl">
                        <h4 className="text-xl font-bold font-outfit text-center bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">Order Summary</h4>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center pb-2 border-b border-blue-100/50">
                                <span className="text-text-muted">Documents</span>
                                <span className="font-bold text-blue-800">{files.length} files</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-blue-100/50">
                                <span className="text-text-muted">Total Pages ({options.side} Sided)</span>
                                <span className="font-bold text-blue-800">{totalPages * options.copies} pg</span>
                            </div>
                            {options.side === 'Double' && (
                                <div className="flex justify-between items-center pb-2 border-b border-blue-100/50 italic animate-in fade-in slide-in-from-top-1 duration-300">
                                    <span className="text-blue-600 font-semibold">Billable Sheets</span>
                                    <span className="font-bold text-blue-800">{Math.ceil(totalPages / 2) * options.copies} sheets</span>
                                </div>
                            )}

                            {fulfillment === 'delivery' && (
                                <div className="flex justify-between items-center pb-2 border-b border-blue-100/50 animate-in fade-in slide-in-from-top-1 duration-300">
                                    <span className="text-text-muted">Weight</span>
                                    <span className="font-bold text-blue-800">{pricing.weight?.toFixed(2) || 0} kg</span>
                                </div>
                            )}

                            {/* Detailed Summary only in Step 4 */}
                            {step === 4 && (
                                <div className="space-y-2 py-2 bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Specifications</p>
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <div><span className="text-text-muted">Mode:</span> <span className="font-bold">{options.mode}</span></div>
                                        <div><span className="text-text-muted">Size:</span> <span className="font-bold">{options.paperSize}</span></div>
                                        <div><span className="text-text-muted">Side:</span> <span className="font-bold">{options.side}</span></div>
                                        <div><span className="text-text-muted">Orient:</span> <span className="font-bold">{options.orientation}</span></div>
                                        <div><span className="text-text-muted">Layout:</span> <span className="font-bold">{options.layout}</span></div>
                                        <div><span className="text-text-muted">Bind:</span> <span className="font-bold">{options.binding} x{options.bindingQuantity}</span></div>
                                        <div><span className="text-text-muted">Copies:</span> <span className="font-bold">{options.copies}</span></div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-text-muted">
                                    <span>Printing Charge</span>
                                    <span>₹{pricing.basePrint.toFixed(2)}</span>
                                </div>
                                {options.binding !== 'None' && (
                                    <div className="flex justify-between text-text-muted">
                                        <span>Binding ({options.bindingQuantity}x)</span>
                                        <span>₹{pricing.binding.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-text-muted animate-in fade-in slide-in-from-top-1 duration-300">
                                    <span>Delivery ({fulfillment})</span>
                                    <span>₹{pricing.delivery.toFixed(2)}</span>
                                </div>
                                {pricing.couponDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 font-semibold">
                                        <span>Coupon Discount</span>
                                        <span>-₹{pricing.couponDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                                {pricing.walletUsed > 0 && (
                                    <div className="flex justify-between text-amber-600 font-semibold">
                                        <span>Wallet Used</span>
                                        <span>-₹{pricing.walletUsed.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t-2 border-blue-200">
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-bold text-gray-800">Grand Total</span>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-blue-700">₹{pricing.total.toFixed(2)}</span>
                                        <p className="text-[10px] text-text-muted">Incl. all taxes</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Place Order ONLY if step 4 */}
                        {step === 4 ? (
                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="w-full py-4 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg shadow-blue-200 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? "Placing Order..." : "Confirm & Place Order 🚀"}
                            </button>
                        ) : (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                                <p className="text-xs text-text-muted italic">Complete Step {step} to proceed</p>
                            </div>
                        )}

                        <div className="flex justify-center gap-4 text-[10px] text-text-muted font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1">🛡️ SECURE</span>
                            <span className="flex items-center gap-1">⚡ FAST</span>
                            <span className="flex items-center gap-1">✨ PREMIUM</span>
                        </div>
                    </div>

                    <div className="card-premium p-6 flex flex-col items-center text-center space-y-2 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                        <p className="text-sm font-bold text-orange-800">💡 Need Help?</p>
                        <p className="text-xs text-text-muted">Confused about sides or binding? Chat with us on WhatsApp for instant assistance.</p>
                        <button className="text-orange-600 font-bold text-sm mt-2 flex items-center gap-2 hover:text-orange-700">WhatsApp Support 🔗</button>
                    </div>
                </div>

                {/* 2. Wizard Steps */}
                <div className="lg:col-span-2 space-y-8">
                    {/* 1. Upload Files */}
                    {step === 1 && (
                        <div className="card-premium space-y-6 border-2 border-blue-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold font-outfit flex items-center gap-2">
                                    <span className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-full flex items-center justify-center text-sm">1</span>
                                    Upload Documents
                                </h3>
                                {processingFiles && <span className="text-sm text-blue-600 animate-pulse">Processing...</span>}
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <label className="border-2 border-dashed border-blue-300 rounded-2xl p-3 flex flex-col items-center gap-1.5 cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all group">
                                    <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
                                    <span className="text-[9px] font-bold text-center uppercase">PDF</span>
                                    <input type="file" className="hidden" multiple accept=".pdf,application/pdf" onChange={handleFileChange} />
                                </label>
                                <label className="border-2 border-dashed border-orange-300 rounded-2xl p-3 flex flex-col items-center gap-1.5 cursor-pointer hover:bg-orange-50 hover:border-orange-500 transition-all group">
                                    <span className="text-2xl group-hover:scale-110 transition-transform">🖼️</span>
                                    <span className="text-[9px] font-bold text-center uppercase">Images</span>
                                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                                </label>
                                <label className="border-2 border-dashed border-purple-300 rounded-2xl p-3 flex flex-col items-center gap-1.5 cursor-pointer hover:bg-purple-50 hover:border-purple-500 transition-all group">
                                    <span className="text-2xl group-hover:scale-110 transition-transform">📁</span>
                                    <span className="text-[9px] font-bold text-center uppercase">All</span>
                                    <input type="file" className="hidden" multiple onChange={handleFileChange} />
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
                                    <div className="grid grid-cols-1 gap-3">
                                        {fileMetadata.map((meta, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-blue-100">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 flex-shrink-0">
                                                        {meta.previewURL ? (
                                                            <img src={meta.previewURL} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-2xl">{getDocumentIcon(meta.type, meta.subType)}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold truncate">{meta.name}</p>
                                                        <div className="flex flex-wrap gap-2 text-[10px] text-text-muted mt-0.5">
                                                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{meta.type}</span>
                                                            {meta.subType && (
                                                                <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-100">{meta.subType}</span>
                                                            )}
                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded">{meta.pageCount} pg</span>
                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded">{formatFileSize(meta.size)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeFile(i)}
                                                    className="ml-2 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4">
                                <button onClick={nextStep} disabled={files.length === 0} className="w-full btn-primary py-4 flex items-center justify-center gap-2">
                                    Continue to Print Options <span className="text-xl">→</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2. Print Options */}
                    {step === 2 && (
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
                                    <label className="text-sm font-semibold text-text-muted">Pages to Print</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setOptions({ ...options, pageRangeType: 'All', customPages: '' })}
                                            className={`flex-1 py-3 rounded-xl border-2 transition-all font-semibold text-xs ${options.pageRangeType === 'All'
                                                ? 'bg-blue-600 text-white border-blue-800'
                                                : 'bg-white border-border'
                                                }`}
                                        >
                                            All Pages ({docPages})
                                        </button>
                                        <button
                                            onClick={() => setOptions({ ...options, pageRangeType: 'Custom' })}
                                            className={`flex-1 py-3 rounded-xl border-2 transition-all font-semibold text-xs ${options.pageRangeType === 'Custom'
                                                ? 'bg-blue-600 text-white border-blue-800'
                                                : 'bg-white border-border'
                                                }`}
                                        >
                                            Custom Selection
                                        </button>
                                    </div>
                                    {options.pageRangeType === 'Custom' && (
                                        <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <input
                                                type="text"
                                                value={options.customPages}
                                                onChange={(e) => setOptions({ ...options, customPages: e.target.value })}
                                                placeholder="e.g. 1-5, 8, 11-13"
                                                className="input-field text-sm font-mono"
                                            />
                                            <p className="text-[10px] text-text-muted mt-1 px-1 italic">Calculated: {calculateCustomPageCount(options.customPages)} pages to print</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted">Orientation</label>
                                    <select value={options.orientation} onChange={(e) => setOptions({ ...options, orientation: e.target.value })} className="input-field">
                                        <option value="Portrait">Portrait</option>
                                        <option value="Landscape">Landscape</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted">Pages per Sheet</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setOptions({ ...options, pagesPerSheet: 1 })}
                                            className={`flex-1 p-3 rounded-xl border-2 transition-all text-left group ${options.pagesPerSheet === 1
                                                ? 'bg-blue-50 border-blue-600'
                                                : 'bg-white border-border hover:border-blue-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`font-bold text-sm ${options.pagesPerSheet === 1 ? 'text-blue-800' : 'text-gray-700'}`}>Standard</span>
                                                {options.pagesPerSheet === 1 && <span className="text-blue-600 text-lg">✓</span>}
                                            </div>
                                            <p className="text-[10px] text-text-muted leading-tight">1 page per side. Best for readability.</p>
                                        </button>

                                        <button
                                            onClick={() => setOptions({ ...options, pagesPerSheet: 2 })}
                                            className={`flex-1 p-3 rounded-xl border-2 transition-all text-left group relative overflow-hidden ${options.pagesPerSheet === 2
                                                ? 'bg-green-50 border-green-600'
                                                : 'bg-white border-border hover:border-green-300'
                                                }`}
                                        >
                                            <div className="absolute top-0 right-0 bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                                                SAVE 50%
                                            </div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`font-bold text-sm ${options.pagesPerSheet === 2 ? 'text-green-800' : 'text-gray-700'}`}>Money Saver</span>
                                                {options.pagesPerSheet === 2 && <span className="text-green-600 text-lg">✓</span>}
                                            </div>
                                            <p className="text-[10px] text-text-muted leading-tight">2 pages per side. Eco-friendly & Cost effective.</p>
                                        </button>
                                    </div>
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
                                    <label className="text-sm font-semibold text-text-muted">Paper Size</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setOptions({ ...options, paperSize: 'A4' })}
                                            className={`flex-1 py-3 rounded-xl border-2 transition-all font-semibold ${options.paperSize === 'A4'
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                                : 'bg-white border-border hover:border-slate-500'
                                                }`}
                                        >
                                            A4 (Standard)
                                        </button>
                                        <button
                                            onClick={() => setOptions({ ...options, paperSize: 'A3' })}
                                            className={`flex-1 py-3 rounded-xl border-2 transition-all font-semibold ${options.paperSize === 'A3'
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                                : 'bg-white border-border hover:border-slate-500'
                                                }`}
                                        >
                                            A3 (Large)
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted">Binding</label>
                                    <div className="flex flex-col gap-2">
                                        <select value={options.binding} onChange={(e) => setOptions({ ...options, binding: e.target.value })} className="input-field">
                                            <option value="None">No Binding</option>
                                            <option value="Spiral">Spiral Binding (+₹15)</option>
                                            <option value="Chart">Chart Binding (+₹150)</option>
                                        </select>
                                        {options.binding !== 'None' && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <label className="text-xs font-bold text-text-muted">Quantity for Binding:</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={options.bindingQuantity}
                                                    onChange={(e) => setOptions({ ...options, bindingQuantity: Number(e.target.value) })}
                                                    className="w-20 px-2 py-1 border border-border rounded"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-text-muted">Additional Notes</label>
                                    <textarea
                                        value={options.notes}
                                        onChange={(e) => setOptions({ ...options, notes: e.target.value })}
                                        className="input-field h-24"
                                        placeholder="Any special instructions or comments..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button onClick={prevStep} className="flex-1 btn-secondary py-4">← Previous</button>
                                <button onClick={nextStep} className="flex-[2] btn-primary py-4">Next Step →</button>
                            </div>
                        </div>
                    )}

                    {/* 3. Fulfillment Method */}
                    {step === 3 && (
                        <div className="card-premium space-y-6 border-2 border-blue-100">
                            <h3 className="text-xl font-bold font-outfit flex items-center gap-2">
                                <span className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-full flex items-center justify-center text-sm">3</span>
                                How Would You Like to Receive?
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setFulfillment('delivery')}
                                    className={`p-5 rounded-2xl border-2 transition-all text-left space-y-2 relative overflow-hidden ${fulfillment === 'delivery'
                                        ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                                        : 'border-border hover:border-blue-300'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="text-3xl">🚚</span>
                                        {fulfillment === 'delivery' && pricing.delivery > 0 && (
                                            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">Calculated</span>
                                        )}
                                    </div>
                                    <p className="font-bold">Home Delivery</p>
                                    <p className="text-[10px] text-text-muted leading-relaxed">
                                        Charges applied by <strong>weight range</strong> + <strong>slip cost</strong> (Dynamic Pricing)
                                    </p>
                                    <p className="text-sm font-black text-blue-700">
                                        {pricing.delivery > 0 ? `₹${pricing.delivery.toFixed(2)}` : 'Calculated at Checkout'}
                                    </p>
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
                                        {/* Address Management UI */}
                                        {fulfillment === 'delivery' && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                                {/* Saved Address View */}
                                                {!isEditingAddress && user?.address ? (
                                                    <div className="p-4 border-2 border-green-100 bg-green-50/50 rounded-2xl flex items-start justify-between">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-green-900">📍 Delivery Address</h4>
                                                                <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Verified</span>
                                                            </div>
                                                            <p className="text-sm text-green-800 font-medium leading-relaxed">
                                                                {delivery.address}<br />
                                                                {delivery.landmark && <span className="text-xs opacity-75">Near {delivery.landmark}<br /></span>}
                                                                {delivery.district}, {delivery.state} - <strong>{delivery.pincode}</strong>
                                                            </p>
                                                            <p className="text-xs text-green-700 font-bold mt-1">📞 {delivery.phone}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setIsEditingAddress(true)}
                                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 underline bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm"
                                                        >
                                                            Edit Address
                                                        </button>
                                                    </div>
                                                ) : (
                                                    /* Edit Address Form */
                                                    <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 relative">
                                                        {user?.address && (
                                                            <button
                                                                onClick={() => setIsEditingAddress(false)}
                                                                className="absolute top-4 right-4 text-[10px] font-bold text-slate-500 hover:text-slate-800 border-b border-slate-300"
                                                            >
                                                                Cancel Editing
                                                            </button>
                                                        )}

                                                        <div className="space-y-2">
                                                            <label className="text-sm font-semibold text-text-muted">Shipping Pincode</label>
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={delivery.pincode}
                                                                    onChange={(e) => handlePincodeChange(e.target.value)}
                                                                    maxLength={6}
                                                                    placeholder="6-digit Pincode"
                                                                    className={`input-field pr-10 tracking-widest ${pincodeError ? 'border-red-500 focus:ring-red-200' : ''}`}
                                                                />
                                                                {pincodeLoading && <span className="absolute right-3 top-3.5 text-xs animate-spin">⌛</span>}
                                                                {!pincodeLoading && delivery.pincode.length === 6 && !pincodeError && (
                                                                    <span className="absolute right-3 top-3.5 text-green-500 text-lg">✓</span>
                                                                )}
                                                            </div>
                                                            {pincodeError && <span className="text-xs text-red-500 font-medium">{pincodeError}</span>}
                                                            {(delivery.district || delivery.state) && (
                                                                <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                                                                    📍 {delivery.district}, {delivery.state}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2 col-span-2">
                                                                <label className="text-sm font-semibold text-text-muted">Full Address</label>
                                                                <textarea
                                                                    value={delivery.address}
                                                                    onChange={(e) => setDelivery(prev => ({ ...prev, address: e.target.value }))}
                                                                    placeholder="House No, Street Name, Area..."
                                                                    className="input-field h-20 resize-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-2 col-span-2">
                                                                <label className="text-sm font-semibold text-text-muted">Landmark (Optional)</label>
                                                                <input
                                                                    type="text"
                                                                    value={delivery.landmark}
                                                                    onChange={(e) => setDelivery(prev => ({ ...prev, landmark: e.target.value }))}
                                                                    placeholder="Near bus stop, temple, etc."
                                                                    className="input-field"
                                                                />
                                                            </div>
                                                            <div className="space-y-2 col-span-2">
                                                                <label className="text-sm font-semibold text-text-muted">Phone Number</label>
                                                                <input
                                                                    type="tel"
                                                                    value={delivery.phone}
                                                                    onChange={(e) => setDelivery(prev => ({ ...prev, phone: e.target.value }))}
                                                                    maxLength={10}
                                                                    placeholder="+91 9876543210"
                                                                    className="input-field"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Save Address Option */}
                                                        {user && (
                                                            <div className="flex items-center gap-3 pt-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id="saveAddress"
                                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                    onChange={async (e) => {
                                                                        if (e.target.checked) {
                                                                            // Validation
                                                                            if (!delivery.pincode || !delivery.address || !delivery.district) {
                                                                                toast.error("Please fill all details to save");
                                                                                e.target.checked = false;
                                                                                return;
                                                                            }
                                                                            const loadToast = toast.loading("Saving to profile...");
                                                                            try {
                                                                                const res = await axios.put('/api/user/update-profile', {
                                                                                    address: {
                                                                                        line1: delivery.address,
                                                                                        pincode: delivery.pincode,
                                                                                        city: delivery.district,
                                                                                        state: delivery.state,
                                                                                        landmark: delivery.landmark
                                                                                    }
                                                                                });
                                                                                if (res.data.success) {
                                                                                    toast.success("Address Saved to Profile! 💾");
                                                                                } else {
                                                                                    toast.error(res.data.message);
                                                                                }
                                                                            } catch (err) {
                                                                                toast.error("Failed to save address");
                                                                            } finally {
                                                                                toast.dismiss(loadToast);
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                                <label htmlFor="saveAddress" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                                                                    Save this address to my profile
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Static Phone Input for Pickup/Layout placeholder (Hidden if Delivery) */}
                                        {fulfillment === 'pickup' && (
                                            <div className="bg-green-50 p-5 rounded-xl border border-green-200 space-y-2">
                                                <p className="font-bold text-green-800">📍 Pickup Location</p>
                                                <p className="text-sm text-green-700">Print Express Store</p>
                                                <p className="text-xs text-green-600">Coimbatore, Tamil Nadu</p>
                                                <p className="text-xs text-text-muted mt-2">You will receive a notification when your order is ready for pickup.</p>
                                            </div>
                                        )}
                                        <div className="flex gap-4 pt-4">
                                            <button onClick={prevStep} className="flex-1 btn-secondary py-4">← Previous</button>
                                            <button onClick={nextStep} className="flex-[2] btn-primary py-4">Next Step →</button>
                                        </div>
                                    </div>
                    )}

                                    {/* 4. Payment Method */}
                                    {step === 4 && (
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
                                            <div className="flex gap-4 pt-4">
                                                <button onClick={prevStep} className="flex-1 btn-secondary py-4">← Previous</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                export default PrintPage;
