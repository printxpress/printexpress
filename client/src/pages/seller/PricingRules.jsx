import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const PricingRules = () => {
    const { axios } = useAppContext();
    const [rules, setRules] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchRules = async () => {
        try {
            const { data } = await axios.get('/api/pricing');
            if (data.success) {
                const fetchedRules = data.pricing.rules;
                // Ensure nesting exists even if DB is old or empty
                const normalizedRules = {
                    printing: {
                        bw: fetchedRules.printing?.bw || { single: 0.75, double: 0.5, a3_single: 2, a3_double: 1.5 },
                        color: fetchedRules.printing?.color || { single: 8, double: 8, a3_single: 20, a3_double: 20 }
                    },
                    additional: {
                        binding: fetchedRules.additional?.binding || 15,
                        hard_binding: fetchedRules.additional?.hard_binding || 200,
                        chart_binding: fetchedRules.additional?.chart_binding || 10,
                        handling_fee: fetchedRules.additional?.handling_fee || 10
                    },
                    delivery: fetchedRules.delivery || 40,
                    delivery_tiers: fetchedRules.delivery_tiers || {
                        tier_a: 40,
                        tier_b: 60,
                        tier_c: 80,
                        tier_d: 150
                    }
                };
                setRules(normalizedRules);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post('/api/pricing/update', rules);
            if (data.success) toast.success("Pricing Updated Successfully");
        } catch (error) {
            toast.error(error.message);
        }
        setLoading(false);
    };

    useEffect(() => { fetchRules(); }, []);

    if (!rules) return <div className="p-8 text-center text-text-muted font-medium">Loading rules...</div>;

    return (
        <div className="max-w-4xl space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-outfit">Printing Price Rules</h2>
                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">Rates in ₹</span>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* B/W Printing */}
                <div className="card-premium p-8 space-y-6">
                    <h3 className="font-bold flex items-center gap-2">
                        <span className="bg-slate-100 p-2 rounded-lg">📄</span> B/W Printing (A4)
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-text-muted">Single Side (A4)</label>
                            <input
                                value={rules.printing.bw.single}
                                onChange={(e) => setRules({ ...rules, printing: { ...rules.printing, bw: { ...rules.printing.bw, single: Number(e.target.value) } } })}
                                type="number" step="0.01" className="input-field w-24 text-center py-2"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-text-muted">Double Side (A4)</label>
                            <input
                                value={rules.printing.bw.double}
                                onChange={(e) => setRules({ ...rules, printing: { ...rules.printing, bw: { ...rules.printing.bw, double: Number(e.target.value) } } })}
                                type="number" step="0.01" className="input-field w-24 text-center py-2"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-text-muted">Single Side (A3)</label>
                            <input
                                value={rules.printing.bw.a3_single}
                                onChange={(e) => setRules({ ...rules, printing: { ...rules.printing, bw: { ...rules.printing.bw, a3_single: Number(e.target.value) } } })}
                                type="number" step="0.01" className="input-field w-24 text-center py-2"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-text-muted">Double Side (A3)</label>
                            <input
                                value={rules.printing.bw.a3_double}
                                onChange={(e) => setRules({ ...rules, printing: { ...rules.printing, bw: { ...rules.printing.bw, a3_double: Number(e.target.value) } } })}
                                type="number" step="0.01" className="input-field w-24 text-center py-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Color Printing */}
                <div className="card-premium p-8 space-y-6">
                    <h3 className="font-bold flex items-center gap-2">
                        <span className="bg-blue-100 p-2 rounded-lg">🌈</span> Color Printing (A4)
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-text-muted">Single Side (A4)</label>
                            <input
                                value={rules.printing.color.single}
                                onChange={(e) => setRules({ ...rules, printing: { ...rules.printing, color: { ...rules.printing.color, single: Number(e.target.value) } } })}
                                type="number" step="0.01" className="input-field w-24 text-center py-2"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-text-muted">Double Side (A4)</label>
                            <input
                                value={rules.printing.color.double}
                                onChange={(e) => setRules({ ...rules, printing: { ...rules.printing, color: { ...rules.printing.color, double: Number(e.target.value) } } })}
                                type="number" step="0.01" className="input-field w-24 text-center py-2"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-text-muted">Single Side (A3)</label>
                            <input
                                value={rules.printing.color.a3_single}
                                onChange={(e) => setRules({ ...rules, printing: { ...rules.printing, color: { ...rules.printing.color, a3_single: Number(e.target.value) } } })}
                                type="number" step="0.01" className="input-field w-24 text-center py-2"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-text-muted">Double Side (A3)</label>
                            <input
                                value={rules.printing.color.a3_double}
                                onChange={(e) => setRules({ ...rules, printing: { ...rules.printing, color: { ...rules.printing.color, a3_double: Number(e.target.value) } } })}
                                type="number" step="0.01" className="input-field w-24 text-center py-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Additional Charges */}
                <div className="card-premium p-8 space-y-6 md:col-span-2">
                    <h3 className="font-bold">Other Services & Fees</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Spiral Binding</label>
                            <input
                                value={rules.additional.binding}
                                onChange={(e) => setRules({ ...rules, additional: { ...rules.additional, binding: Number(e.target.value) } })}
                                type="number" className="input-field"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Hard Binding</label>
                            <input
                                value={rules.additional.hard_binding}
                                onChange={(e) => setRules({ ...rules, additional: { ...rules.additional, hard_binding: Number(e.target.value) } })}
                                type="number" className="input-field"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Chart Binding</label>
                            <input
                                value={rules.additional.chart_binding}
                                onChange={(e) => setRules({ ...rules, additional: { ...rules.additional, chart_binding: Number(e.target.value) } })}
                                type="number" className="input-field"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Handling Fee</label>
                            <input
                                value={rules.additional.handling_fee}
                                onChange={(e) => setRules({ ...rules, additional: { ...rules.additional, handling_fee: Number(e.target.value) } })}
                                type="number" className="input-field"
                            />
                        </div>
                    </div>
                </div>

                {/* Weight-Based Delivery Tiers */}
                <div className="card-premium p-8 space-y-6 md:col-span-2">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <span className="bg-orange-100 p-2 rounded-lg">🚚</span> Weight-Based Delivery Charges
                        </h3>
                        <p className="text-[10px] bg-secondary/10 text-secondary px-3 py-1 rounded-full font-bold">Automatic Calculation</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {['tier_a', 'tier_b', 'tier_c'].map((tierKey) => (
                            <div key={tierKey} className="space-y-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                <h4 className="text-sm font-bold text-primary uppercase">
                                    {tierKey === 'tier_a' ? 'Small (Up to 3kg)' : tierKey === 'tier_b' ? 'Medium (3-10kg)' : 'Large (10kg+)'}
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                                        <label className="text-[10px] font-bold text-text-muted">Max Weight (kg)</label>
                                        <input
                                            value={rules.delivery_tiers[tierKey].maxWeight}
                                            onChange={(e) => setRules({
                                                ...rules,
                                                delivery_tiers: {
                                                    ...rules.delivery_tiers,
                                                    [tierKey]: { ...rules.delivery_tiers[tierKey], maxWeight: Number(e.target.value) }
                                                }
                                            })}
                                            type="number" className="w-16 text-center text-xs font-bold border-none outline-none"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                                        <label className="text-[10px] font-bold text-text-muted">Rate (₹/kg)</label>
                                        <input
                                            value={rules.delivery_tiers[tierKey].rate}
                                            onChange={(e) => setRules({
                                                ...rules,
                                                delivery_tiers: {
                                                    ...rules.delivery_tiers,
                                                    [tierKey]: { ...rules.delivery_tiers[tierKey], rate: Number(e.target.value) }
                                                }
                                            })}
                                            type="number" className="w-16 text-center text-xs font-bold border-none outline-none"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                                        <label className="text-[10px] font-bold text-text-muted">Slip Charge (₹)</label>
                                        <input
                                            value={rules.delivery_tiers[tierKey].slip}
                                            onChange={(e) => setRules({
                                                ...rules,
                                                delivery_tiers: {
                                                    ...rules.delivery_tiers,
                                                    [tierKey]: { ...rules.delivery_tiers[tierKey], slip: Number(e.target.value) }
                                                }
                                            })}
                                            type="number" className="w-16 text-center text-xs font-bold border-none outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-[10px] text-blue-700 font-medium">
                            💡 <strong>How it works:</strong> Weight is calculated as (Sheets / 200) + Binding Weight.
                            1 sheet = 5g. Spiral = 100g, Chart = 50g.
                        </p>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <button disabled={loading} className="btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-primary/20">
                        {loading ? 'Updating...' : 'Save All Changes 💾'}
                    </button>
                    <p className="text-center text-xs text-text-muted mt-4 font-medium">Any changes made here will immediately affect new user orders.</p>
                </div>
            </form>
        </div>
    );
};

export default PricingRules;
