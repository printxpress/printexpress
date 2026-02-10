import React from 'react';

const PrintExpressLogo = ({ className = "h-10", variant = "full" }) => {
    if (variant === "icon") {
        return (
            <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e40af" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                </defs>
                {/* Printer base */}
                <rect x="10" y="25" width="40" height="25" rx="3" fill="url(#logoGradient)" />
                <rect x="15" y="30" width="30" height="3" fill="white" opacity="0.3" />
                <rect x="15" y="36" width="30" height="3" fill="white" opacity="0.3" />
                <rect x="15" y="42" width="20" height="3" fill="white" opacity="0.3" />
                {/* Paper airplane */}
                <path d="M35 8 L52 15 L35 22 L38 15 Z" fill="#f97316" />
                <path d="M35 15 L45 20" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                {/* Speed lines */}
                <line x1="25" y1="12" x2="32" y2="12" stroke="#f97316" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                <line x1="22" y1="17" x2="30" y2="17" stroke="#f97316" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            </svg>
        );
    }

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <svg className="h-10 w-10" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e40af" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                </defs>
                {/* Printer base */}
                <rect x="10" y="25" width="40" height="25" rx="3" fill="url(#logoGradient)" />
                <rect x="15" y="30" width="30" height="3" fill="white" opacity="0.3" />
                <rect x="15" y="36" width="30" height="3" fill="white" opacity="0.3" />
                <rect x="15" y="42" width="20" height="3" fill="white" opacity="0.3" />
                {/* Paper airplane */}
                <path d="M35 8 L52 15 L35 22 L38 15 Z" fill="#f97316" />
                <path d="M35 15 L45 20" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                {/* Speed lines */}
                <line x1="25" y1="12" x2="32" y2="12" stroke="#f97316" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                <line x1="22" y1="17" x2="30" y2="17" stroke="#f97316" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            </svg>
            <div className="flex flex-col leading-none">
                <span className="text-2xl font-bold font-outfit bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
                    PRINT
                </span>
                <span className="text-xl font-bold font-outfit text-orange-500">
                    EXPRESS
                </span>
            </div>
        </div>
    );
};

export default PrintExpressLogo;
