import React from "react";
import { Link } from "react-router-dom";

// Landing page section explaining how the platform works, step by step.
export default function HowItWorksSection() {
    const steps = [
        {
            num: "01",
            title: "Register Your Solar Node",
            desc: "Submit your name, NIC, address, and rooftop solar capacity (kW) via our web portal. Your submission is recorded securely in the Solarix registry.",
            accent: "from-amber-400 to-amber-600",
            icon: (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            )
        },
        {
            num: "02",
            title: "Backoffice Grid Approval",
            desc: "Solarix Backoffice electrical engineers verify your technical details to guarantee grid harmony. Once approved, your account status switches to Active.",
            accent: "from-emerald-400 to-emerald-600",
            icon: (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            )
        },
        {
            num: "03",
            title: "Download App via QR",
            desc: "Scan our quick QR code with your Android smartphone to install the Solarix Prosumer mobile application for on-the-go slot booking.",
            accent: "from-amber-500 to-amber-700",
            icon: (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            num: "04",
            title: "Book, Scan QR & Trade",
            desc: "Reserve battery storage slots, visit neighborhood solar hubs, scan transfer QR codes with Grid Operators, and collect daily credits.",
            accent: "from-emerald-500 to-emerald-700",
            icon: (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        }
    ];

    return (
        <section id="how-it-works" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-primary bg-amber-50 border border-amber-200">
                        Workflow & Onboarding
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                        How to Join the Solarix Microgrid
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base">
                        From initial registration to clean energy injection — four simple steps to power your neighborhood.
                    </p>
                </div>

                {/* Steps Horizontal Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                    {steps.map((step, idx) => (
                        <div key={idx} className="relative group">
                            {/* Card Container */}
                            <div className="bg-slate-50/70 hover:bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between">
                                <div className="space-y-4">
                                    {/* Number & Icon Pill */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-black text-slate-300 group-hover:text-primary transition-colors">
                                            {step.num}
                                        </span>
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.accent} flex items-center justify-center shadow-md`}>
                                            {step.icon}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-foreground">
                                        {step.title}
                                    </h3>

                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        {step.desc}
                                    </p>
                                </div>

                                {idx === 0 && (
                                    <div className="pt-4 mt-4 border-t border-slate-200/60">
                                        <Link to="/register" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                            Start step 1 now →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
