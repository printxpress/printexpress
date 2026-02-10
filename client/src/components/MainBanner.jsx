import React from 'react'
import { Link } from 'react-router-dom'

const MainBanner = () => {
  return (
    <div className='relative py-12 md:py-24 overflow-hidden'>
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-72 h-72 bg-secondary/5 rounded-full blur-3xl opacity-50"></div>

      <div className='flex flex-col md:flex-row items-center gap-12'>
        <div className='flex-1 text-center md:text-left space-y-6 animate-in slide-in-from-left duration-700'>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Trusted by 2000+ Customers
          </div>
          <h1 className='text-4xl md:text-5xl lg:text-7xl font-bold font-outfit leading-tight lg:leading-[1.1]'>
            Your Documents, <br />
            <span className="text-primary">Printed</span> & <span className="text-secondary">Delivered</span> <br />
            Fast!
          </h1>
          <p className='text-text-muted text-lg max-w-lg'>
            Upload any document — PDF, Word, Images — select your preferences, and we'll print with premium quality and deliver to your doorstep across India!
          </p>

          <div className='flex flex-col sm:flex-row items-center gap-4 pt-4'>
            <Link to="/print" className='btn-primary w-full sm:w-auto text-lg flex items-center justify-center gap-2'>
              🚀 Start Printing
            </Link>
            <Link to="/vouchers" className='btn-outline w-full sm:w-auto text-lg'>
              🎟️ View Offers
            </Link>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-8 pt-8 text-sm text-text-muted font-medium">
            <div className="flex items-center gap-2">⭐ 4.9 Rating</div>
            <div className="flex items-center gap-2">⚡ Fast Delivery</div>
            <div className="flex items-center gap-2">🛡️ 100% Safe</div>
          </div>
        </div>

        <div className='flex-1 relative animate-in slide-in-from-right duration-700'>
          {/* Printing Business Visual */}
          <div className="relative z-10 card-premium p-6 md:p-8 bg-gradient-to-br from-blue-50 to-orange-50 border-white/60 shadow-2xl">
            <div className="grid grid-cols-2 gap-4">
              {/* Document Types */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 space-y-3 hover:shadow-lg transition-shadow">
                <span className="text-4xl">📄</span>
                <h3 className="font-bold font-outfit text-sm">Documents</h3>
                <p className="text-[10px] text-text-muted">PDF, DOC, PPT</p>
                <p className="text-primary font-bold">₹2/page</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 space-y-3 hover:shadow-lg transition-shadow">
                <span className="text-4xl">🖼️</span>
                <h3 className="font-bold font-outfit text-sm">Photos</h3>
                <p className="text-[10px] text-text-muted">JPG, PNG, HEIC</p>
                <p className="text-orange-600 font-bold">₹10/print</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100 space-y-3 hover:shadow-lg transition-shadow">
                <span className="text-4xl">🪪</span>
                <h3 className="font-bold font-outfit text-sm">ID Cards</h3>
                <p className="text-[10px] text-text-muted">PVC, Laminated</p>
                <p className="text-green-600 font-bold">₹100/set</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 space-y-3 hover:shadow-lg transition-shadow">
                <span className="text-4xl">📚</span>
                <h3 className="font-bold font-outfit text-sm">Binding</h3>
                <p className="text-[10px] text-text-muted">Spiral, Hard</p>
                <p className="text-purple-600 font-bold">₹50/book</p>
              </div>
            </div>

            {/* Starting price badge */}
            <div className="absolute -bottom-4 -left-4 card-premium px-4 py-3 bg-white shadow-xl hidden lg:block">
              <p className="font-outfit font-bold text-primary text-lg">₹2</p>
              <p className="text-[10px] text-text-muted">Starting Price/Page</p>
            </div>
          </div>

          {/* Floating Icons */}
          <div className="absolute top-6 -right-4 w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center animate-bounce duration-[3000ms]">🖨️</div>
          <div className="absolute bottom-16 -right-8 w-14 h-14 bg-white rounded-lg shadow-lg flex items-center justify-center animate-bounce duration-[4000ms]">📦</div>
        </div>
      </div>
    </div>
  )
}

export default MainBanner
