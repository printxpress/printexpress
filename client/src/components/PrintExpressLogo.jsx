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
        <div className={`flex items-center gap-4 ${className}`}>
            <img
                src={logo}
                alt="Print Express"
                className="h-20 md:h-28 object-contain animate-in fade-in zoom-in duration-1000 hover:scale-105 transition-transform cursor-pointer"
            />
        </div>
    );
};

export default PrintExpressLogo;
