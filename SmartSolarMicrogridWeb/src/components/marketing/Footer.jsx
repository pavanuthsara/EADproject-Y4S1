import React from "react";
import { Link } from "react-router-dom";

// Site footer with links and a shortcut to the registration status check.
export default function Footer({ onOpenStatusModal }) {
    return (
        <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
                    {/* Brand column */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white font-black">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                            </div>
                            <span className="text-xl font-black text-white tracking-tight">
                                Solarix <span className="text-primary font-normal text-sm">Microgrid</span>
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
                            Decentralized smart solar microgrid infrastructure. Empowering prosumers to inject clean energy, monetize rooftop generation, and stabilize neighborhood power circuits.
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 pt-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                Colombo Operations Active
                            </span>
                        </div>
                    </div>

                    {/* Prosumer Links */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-white">
                            For Prosumers
                        </p>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <Link to="/register" className="hover:text-white transition-colors">
                                    Register Solar System
                                </Link>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={onOpenStatusModal}
                                    className="hover:text-white transition-colors text-left"
                                >
                                    Check Approval Status
                                </button>
                            </li>
                            <li>
                                <a href="#calculator" className="hover:text-white transition-colors">
                                    Solar Potential Calculator
                                </a>
                            </li>
                            <li>
                                <a href="#mobile-app" className="hover:text-white transition-colors">
                                    Mobile App Download & QR
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Platform Links */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-white">
                            Platform & Operations
                        </p>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <a href="#features" className="hover:text-white transition-colors">
                                    Microgrid Features
                                </a>
                            </li>
                            <li>
                                <a href="#how-it-works" className="hover:text-white transition-colors">
                                    How It Works
                                </a>
                            </li>
                            <li>
                                <Link to="/login" className="hover:text-white transition-colors text-amber-400 font-semibold">
                                    Backoffice Console
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="hover:text-white transition-colors text-emerald-400 font-semibold">
                                    Grid Operator Console
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Regulatory & Standards */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-white">
                            Standards & Compliance
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Interconnected under IEEE 1547 and national utility electrical standards. All installations subject to Backoffice approval before power synchronization.
                        </p>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
                    <p>© {new Date().getFullYear()} Solarix Microgrid Energy Operations. Group 42. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
                        <span className="hover:text-slate-300 cursor-pointer">Terms of Grid Interconnection</span>
                        <span className="hover:text-slate-300 cursor-pointer">Support</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
