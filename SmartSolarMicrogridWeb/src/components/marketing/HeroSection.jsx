import React from "react";
import { Link } from "react-router-dom";

// Landing page hero with the main calls to action.
export default function HeroSection({ onOpenStatusModal }) {
    return (
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-slate-50 via-white to-slate-50">
            {/* Ambient decorative lighting */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-primary/25 blur-3xl" />
                <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-secondary/25 blur-3xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    {/* Left Column: Marketing Pitch */}
                    <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                        {/* Innovation Pill */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 shadow-xs">
                            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                                Decentralized Energy Revolution
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white text-emerald-700 border border-emerald-200">
                                Zero Commission
                            </span>
                        </div>

                        {/* Hero Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
                            Turn Your Rooftop Solar Into a{" "}
                            <span className="bg-gradient-to-r from-primary via-amber-600 to-secondary bg-clip-text text-transparent">
                                Neighborhood Microgrid.
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                            Connect your solar PV installation to <strong>Solarix Microgrid</strong>. 
                            Feed surplus energy into community battery hubs, earn transparent tariffs, 
                            and dispatch energy seamlessly with our native Android mobile app.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                            <Link
                                to="/register"
                                className="w-full sm:w-auto px-7 py-4 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary to-primary-dark hover:brightness-105 active:scale-95 shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2.5 group"
                            >
                                <span>Register Your Solar Node</span>
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>

                            <a
                                href="#mobile-app"
                                className="w-full sm:w-auto px-6 py-4 rounded-xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2 group"
                            >
                                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span>Download Mobile App & QR</span>
                            </a>
                        </div>

                        {/* Trust & Guarantee Marks */}
                        <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-500">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Backoffice Verified Tie-In</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Live Energy Telemetry</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Automated Battery Slots</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Live Microgrid Dynamic Card */}
                    <div className="lg:col-span-5">
                        <div className="relative mx-auto max-w-md lg:max-w-none">
                            {/* Card Background Glow */}
                            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/30 to-secondary/30 blur-xl opacity-75" />

                            {/* Main Card */}
                            <div className="relative bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-primary">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">Solarix Grid Core</p>
                                            <p className="text-xs text-muted">Active Dispatch Node #45</p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                                        LIVE SYNC
                                    </span>
                                </div>

                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-2 gap-3.5">
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Surplus Injection</p>
                                        <p className="text-xl font-black text-foreground mt-1">4,280 <span className="text-xs font-semibold text-slate-500">kWh</span></p>
                                        <span className="text-[11px] font-semibold text-secondary flex items-center gap-1 mt-1">
                                            ↑ +18.4% this week
                                        </span>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Grid Feed-in Tariff</p>
                                        <p className="text-xl font-black text-primary mt-1">LKR 42.50 <span className="text-xs font-semibold text-slate-500">/ kWh</span></p>
                                        <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
                                            Guaranteed Base Rate
                                        </span>
                                    </div>
                                </div>

                                {/* Microgrid Station Slot Visualization */}
                                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-300 font-medium">Colombo Central Hub Battery Bank</span>
                                        <span className="text-emerald-400 font-bold">84% Full</span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: "84%" }}></div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                                        <span>4 of 5 Charging Bays Open</span>
                                        <span className="text-amber-300">Accepting Prosumer Injections</span>
                                    </div>
                                </div>

                                {/* Registration CTA Banner inside Card */}
                                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-center justify-between">
                                    <div className="text-xs">
                                        <p className="font-bold text-amber-950">Have a Solar System?</p>
                                        <p className="text-amber-800 text-[11px]">Register in 2 minutes & get verified.</p>
                                    </div>
                                    <Link
                                        to="/register"
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors shadow-xs"
                                    >
                                        Join Now
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
