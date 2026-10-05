import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Top navigation bar with a collapsible mobile menu.
export default function Navbar({ onOpenStatusModal }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Brand Logo & Name */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
                            {/* Solar Bolt Mark */}
                            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" fillOpacity="0.8" />
                            </svg>
                            {/* Pulsing indicator */}
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black tracking-tight text-foreground font-sans">
                                    Solarix
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary-soft text-primary-dark border border-primary/30">
                                    Microgrid
                                </span>
                            </div>
                            <p className="text-[11px] font-medium text-muted tracking-tight">
                                Clean Energy Network
                            </p>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-8">
                        <a
                            href="#features"
                            className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
                        >
                            Why Solarix
                        </a>
                        <a
                            href="#calculator"
                            className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
                        >
                            Solar Calculator
                        </a>
                        <a
                            href="#how-it-works"
                            className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
                        >
                            How It Works
                        </a>
                        <a
                            href="#mobile-app"
                            className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
                        >
                            Mobile App
                        </a>
                    </nav>

                    {/* Right Action Buttons */}
                    <div className="hidden lg:flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onOpenStatusModal}
                            className="px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Check Status
                        </button>

                        <Link
                            to="/login"
                            className="px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-700 hover:text-foreground hover:bg-slate-50 transition-colors"
                        >
                            Staff Console
                        </Link>

                        <Link
                            to="/register"
                            className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl text-white bg-gradient-to-r from-primary to-primary-dark hover:brightness-105 active:scale-95 shadow-md shadow-primary/30 transition-all flex items-center gap-2"
                        >
                            <span>Register Prosumer</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>

                    {/* Mobile Hamburger Toggle */}
                    <div className="flex md:hidden items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-slate-100 space-y-3 animate-rise">
                        <div className="flex flex-col space-y-2">
                            <a
                                href="#features"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                            >
                                Why Solarix
                            </a>
                            <a
                                href="#calculator"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                            >
                                Solar Calculator
                            </a>
                            <a
                                href="#how-it-works"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                            >
                                How It Works
                            </a>
                            <a
                                href="#mobile-app"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                            >
                                Mobile App & QR
                            </a>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    if (onOpenStatusModal) onOpenStatusModal();
                                }}
                                className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between"
                            >
                                <span>Check Registration Status</span>
                                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                            </button>

                            <Link
                                to="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                            >
                                Staff Login (Backoffice / Operator)
                            </Link>

                            <Link
                                to="/register"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="mt-2 w-full text-center py-3 text-sm font-bold uppercase tracking-wider rounded-xl text-white bg-primary shadow-md shadow-primary/30"
                            >
                                Register Prosumer Node
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
