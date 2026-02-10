import React from 'react';

const PrintingAnimation = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
            <div className="relative w-80 h-80">
                {/* Globe */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full border-4 border-blue-200 relative overflow-hidden">
                        {/* Globe grid lines */}
                        <div className="absolute inset-0">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={`h-${i}`}
                                    className="absolute w-full border-t border-blue-100"
                                    style={{ top: `${(i + 1) * 16.66}%` }}
                                />
                            ))}
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={`v-${i}`}
                                    className="absolute h-full border-l border-blue-100"
                                    style={{ left: `${(i + 1) * 16.66}%` }}
                                />
                            ))}
                        </div>
                        {/* Continents (simplified shapes) */}
                        <div className="absolute top-8 left-12 w-8 h-6 bg-blue-300 rounded-lg opacity-40" />
                        <div className="absolute top-16 right-8 w-10 h-8 bg-blue-300 rounded-full opacity-40" />
                        <div className="absolute bottom-12 left-8 w-12 h-10 bg-blue-300 rounded-lg opacity-40" />
                    </div>
                </div>

                {/* Orbiting papers */}
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className="absolute inset-0 animate-orbit"
                        style={{
                            animationDelay: `${index * 0.5}s`,
                            animationDuration: '4s'
                        }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="paper-sheet">
                                <div className="w-8 h-10 bg-white shadow-lg rounded-sm border border-gray-200 relative overflow-hidden">
                                    {/* Paper lines */}
                                    <div className="absolute top-2 left-1 right-1 h-px bg-blue-400" />
                                    <div className="absolute top-4 left-1 right-1 h-px bg-blue-400" />
                                    <div className="absolute top-6 left-1 right-1 h-px bg-blue-400" />
                                    <div className="absolute top-8 left-1 right-2 h-px bg-blue-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Printer icon in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-xl flex items-center justify-center animate-pulse">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Loading text */}
            <div className="mt-8 text-center space-y-2">
                <h3 className="text-2xl font-bold font-outfit bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
                    Processing Your Documents
                </h3>
                <p className="text-gray-600 animate-pulse">Preparing your print job...</p>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2 mt-6">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>

            <style jsx>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(140px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(140px) rotate(-360deg);
          }
        }

        .animate-orbit {
          animation: orbit 4s linear infinite;
        }

        .paper-sheet {
          animation: float 2s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(-5deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
        }
      `}</style>
        </div>
    );
};

export default PrintingAnimation;
