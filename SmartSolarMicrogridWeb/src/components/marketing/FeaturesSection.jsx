import React from "react";

// Landing page section listing the platform features.
export default function FeaturesSection() {
    const features = [
        {
            icon: (
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            title: "Automated Solar Injection",
            badge: "Clean Revenue",
            badgeColor: "bg-amber-100 text-amber-800",
            description: "Whenever your solar array generates excess power during peak daylight, automatically route energy into neighborhood microgrid circuits and earn high-yield feed-in tariffs."
        },
        {
            icon: (
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            title: "Smart Battery Storage Hubs",
            badge: "Dynamic Buffering",
            badgeColor: "bg-emerald-100 text-emerald-800",
            description: "No need to invest in expensive home battery banks. Solarix links your premises to shared high-density lithium storage nodes with automated reservation slots."
        },
        {
            icon: (
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
            title: "Native Android Mobile App",
            badge: "QR Verification",
            badgeColor: "bg-amber-100 text-amber-800",
            description: "Manage bookings, generate cryptographic transfer QR codes, and monitor solar telemetry in real time directly from your pocket."
        },
        {
            icon: (
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            title: "Backoffice Verified Security",
            badge: "Grid Certified",
            badgeColor: "bg-emerald-100 text-emerald-800",
            description: "Every prosumer account undergoes strict verification by licensed Backoffice electrical engineers to guarantee grid stability and voltage compliance."
        }
    ];

    return (
        <section id="features" className="py-20 bg-slate-50/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-secondary bg-emerald-50 border border-emerald-200">
                        Prosumer Advantages
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                        Built for Modern Solar Energy Producers
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base">
                        Solarix transforms ordinary residential solar installations into high-efficiency participants in our smart neighborhood microgrid.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                                        {item.icon}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${item.badgeColor}`}>
                                        {item.badge}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-foreground">
                                    {item.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                            <div className="pt-6 border-t border-slate-100 mt-6 flex items-center text-xs font-bold text-primary group cursor-pointer">
                                <span>Learn more</span>
                                <svg className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
