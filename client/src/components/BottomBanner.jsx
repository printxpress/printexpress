import React from 'react'

const BottomBanner = () => {
  const benefits = [
    {
      title: "Ultra Fast Delivery",
      desc: "Get your documents delivered within 2 hours in local zones across India.",
      icon: "⚡",
      color: "blue"
    },
    {
      title: "Premium Quality",
      desc: "We use high-grade 80GSM paper and original HP/Canon inks for best results.",
      icon: "💎",
      color: "purple"
    },
    {
      title: "100% Secure",
      desc: "Your files are encrypted and automatically deleted after printing for your privacy.",
      icon: "🛡️",
      color: "green"
    },
    {
      title: "Affordable Pricing",
      desc: "Starting from just ₹2 per page for B/W and ₹10 for color prints.",
      icon: "💰",
      color: "orange"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'hover:border-blue-300 hover:shadow-blue-100',
      purple: 'hover:border-purple-300 hover:shadow-purple-100',
      green: 'hover:border-green-300 hover:shadow-green-100',
      orange: 'hover:border-orange-300 hover:shadow-orange-100'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className='py-16 md:py-24 bg-gradient-to-br from-blue-50 via-white to-orange-50 rounded-3xl md:rounded-[40px] px-6 md:px-12 lg:px-16 overflow-hidden relative'>
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-primary/10 rounded-full -mr-24 md:-mr-32 -mt-24 md:-mt-32 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-secondary/10 rounded-full -ml-24 md:-ml-32 -mb-24 md:-mb-32 blur-3xl"></div>

      <div className='relative grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center'>

        {/* Left Section - Hero Content */}
        <div className="space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-green-100 rounded-full border border-orange-300 mb-2">
            <span className="text-xl">🇮🇳</span>
            <span className="text-xs md:text-sm font-bold text-gray-700">Serving All India</span>
          </div>

          <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold font-outfit tracking-tight leading-tight'>
            Experience the <span className="text-primary italic">Future</span> of Printing
          </h2>

          <p className="text-text-muted text-base md:text-lg max-w-md mx-auto lg:mx-0">
            We combine cutting-edge printing technology with fast nationwide delivery to bring you the best printing experience across India.
          </p>

          {/* Pricing Highlight */}
          <div className="inline-flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
            <div className="px-4 py-3 bg-white rounded-xl border-2 border-blue-200 shadow-sm">
              <p className="text-xs text-text-muted">B/W Printing</p>
              <p className="text-2xl font-bold text-primary font-outfit">₹2<span className="text-sm font-normal">/page</span></p>
            </div>
            <div className="px-4 py-3 bg-white rounded-xl border-2 border-orange-200 shadow-sm">
              <p className="text-xs text-text-muted">Color Printing</p>
              <p className="text-2xl font-bold text-orange-600 font-outfit">₹10<span className="text-sm font-normal">/page</span></p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center lg:justify-start">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center text-white font-bold text-sm"
                >
                  {i === 1 && '😊'}
                  {i === 2 && '🎉'}
                  {i === 3 && '⭐'}
                  {i === 4 && '👍'}
                </div>
              ))}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-bold">10,000+ Happy Customers</p>
              <p className="text-xs text-text-muted">Trusted across India</p>
            </div>
          </div>
        </div>

        {/* Right Section - Benefits Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6'>
          {benefits.map((item, index) => (
            <div
              key={index}
              className={`card-premium p-5 md:p-6 space-y-3 hover-lift ${getColorClasses(item.color)} animate-fade-in-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl md:text-4xl">{item.icon}</span>
                <h3 className='text-base md:text-lg font-bold font-outfit'>{item.title}</h3>
              </div>
              <p className='text-text-muted text-xs md:text-sm leading-relaxed'>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 text-center">
        <p className="text-sm text-text-muted mb-4">Ready to get started?</p>
        <a
          href="/print"
          className="inline-flex items-center gap-2 btn-primary px-8 py-4 text-lg hover-glow"
        >
          Start Printing Now
          <span className="text-xl">→</span>
        </a>
      </div>
    </div>
  )
}

export default BottomBanner
