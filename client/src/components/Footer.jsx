import React from 'react';
import { NavLink } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-24 py-8 border-t border-blue-100 bg-white">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted">
                <p>© {currentYear} Print Express. All India Printing & Delivery Service. 🇮🇳</p>
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
                    <p className="font-bold text-blue-700">🕒 Working Hours: 10:00 AM - 6:00 PM Everyday</p>
                    <div className="flex gap-8">
                        <NavLink to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</NavLink>
                        <NavLink to="/terms" className="hover:text-primary transition-colors">Terms of Service</NavLink>
                        <a href="mailto:support@printexpress.in" className="hover:text-primary transition-colors">Contact Support</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;