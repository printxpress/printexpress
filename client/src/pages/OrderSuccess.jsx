import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const OrderSuccess = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const navigate = useNavigate();
    const { axios } = useAppContext();

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-6">
            <div className="card-premium max-w-md w-full p-10 text-center space-y-8 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto shadow-inner">
                    🎉
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-black font-outfit text-text-main tracking-tight italic uppercase">Order Placed!</h1>
                    <p className="text-text-muted font-medium text-sm">
                        Thank you for choosing Print Express. Your order <span className="text-primary font-bold">#{orderId?.slice(-8).toUpperCase()}</span> has been received and is being processed.
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <button
                        onClick={() => window.open(`${axios.defaults.baseURL}/api/order/thermal-bill/${orderId}`, '_blank')}
                        className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                    >
                        <span>Download Bill</span>
                        <span className="text-lg">📄</span>
                    </button>

                    <button
                        onClick={() => navigate('/my-orders')}
                        className="w-full py-4 bg-slate-50 border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-white hover:border-primary/30 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        View All Orders
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="text-primary font-bold text-xs hover:underline pt-2"
                    >
                        Back to Home
                    </button>
                </div>
            </div>

            <p className="mt-8 text-text-muted text-[10px] uppercase font-bold tracking-[0.2em]">Print Express • Quality at Speed</p>
        </div>
    );
};

export default OrderSuccess;
