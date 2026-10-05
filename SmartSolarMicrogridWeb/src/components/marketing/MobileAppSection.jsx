import React, { useState } from "react";
import QRCodeWidget from "../common/QRCodeWidget";

// Landing page section promoting the prosumer mobile app.
export default function MobileAppSection({ qrCodeImageUrl = null }) {
    const [downloading, setDownloading] = useState(false);

    // Shows download information for the Android app.
    const handleDownloadApk = () => {
        setDownloading(true);
        setTimeout(() => {
            setDownloading(false);
            alert("Solarix Mobile App (Android APK):\n\nThe QR code points to the prosumer mobile build. You can update the QR code image or download target URL anytime in your project configuration!");
        }, 800);
    };

    return (
        <section id="mobile-app" className="py-20 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
            {/* Background blur discs */}
            <div className="absolute top-1/2 left-0 w-80 h-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-2xl border border-slate-700/60">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Left Column: App pitch */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Android Native App v1.0
                            </div>

                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                                Energy Management,{" "}
                                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 bg-clip-text text-transparent">
                                    Direct in Your Pocket.
                                </span>
                            </h2>

                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                                The <strong>Solarix Prosumer Mobile App</strong> gives you total control over your solar production. 
                                Book battery storage slots, generate cryptographic QR tokens for physical energy handover at microgrid stations, 
                                and track your credits in real time.
                            </p>

                            {/* Features list */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/70">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-200">
                                        Dynamic QR Generation
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/70">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-200">
                                        Live Inverter Telemetry
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/70">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-200">
                                        Instant Slot Reservations
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/70">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-200">
                                        Tariff & Payout Wallet
                                    </span>
                                </div>
                            </div>

                            {/* Direct Download Button */}
                            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                <button
                                    type="button"
                                    onClick={handleDownloadApk}
                                    disabled={downloading}
                                    className="px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-900 bg-gradient-to-r from-primary to-amber-400 hover:brightness-105 active:scale-95 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span>{downloading ? "Preparing APK..." : "Download Android APK (v1.0)"}</span>
                                </button>
                                <span className="text-xs text-slate-400 text-center sm:text-left">
                                    Requires Android 8.0+ • Size ~28 MB
                                </span>
                            </div>
                        </div>

                        {/* Right Column: QR Code Container */}
                        <div className="lg:col-span-5 flex flex-col items-center">
                            <div className="bg-slate-800/90 p-8 rounded-3xl border border-slate-700 shadow-xl flex flex-col items-center text-center relative group">
                                <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
                                    Quick Mobile Install
                                </span>

                                {/* QR Code Graphic */}
                                <div className="bg-white p-4 rounded-2xl shadow-inner">
                                    <QRCodeWidget
                                        imageUrl={qrCodeImageUrl}
                                        size={200}
                                        label=""
                                        sublabel=""
                                        showScanCorners={true}
                                    />
                                </div>

                                <p className="mt-4 text-xs font-semibold text-white">
                                    Scan to Download Prosumer App
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                                    Point your smartphone camera at this QR code to download the application package directly.
                                </p>

                                <div className="mt-4 pt-3 border-t border-slate-700/80 w-full text-[10px] text-slate-400 font-mono">
                                    [QR Target]: SolarixMobile.apk
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
