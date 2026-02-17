import React from 'react';
import logo from '../assets/logo.png';

const PrintExpressLogo = ({ className = "h-10", variant = "full" }) => {
    if (variant === "icon") {
        return (
            <img
                src={logo}
                alt="Logo"
                className={`${className} object-contain`}
            />
        );
    }

    return (
        <div className="flex items-center gap-2">
            <img
                src={logo}
                alt="Print Express"
                className="h-9 md:h-10 object-contain hover:scale-105 transition-transform cursor-pointer"
            />
            <span className="font-outfit font-bold text-lg md:text-xl text-slate-900">
                Print <span className="text-primary">Express</span>
            </span>
        </div>
    );
};

export default PrintExpressLogo;
