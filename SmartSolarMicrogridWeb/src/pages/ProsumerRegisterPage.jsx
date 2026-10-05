import React, { useState } from "react";
import { Link } from "react-router-dom";
import ProsumerRegisterForm from "../components/prosumer/ProsumerRegisterForm";
import PendingApprovalView from "../components/prosumer/PendingApprovalView";
import StatusCheckModal from "../components/prosumer/StatusCheckModal";
import QRCodeWidget from "../components/common/QRCodeWidget";

// Standalone prosumer registration page.
export default function ProsumerRegisterPage() {
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [registeredProsumer, setRegisteredProsumer] = useState(() => {
        const cached = localStorage.getItem("solarix_prosumer_pending");
        return cached ? JSON.parse(cached) : null;
    });

    // Remembers the newly registered prosumer and scrolls to the top.
    const handleSuccess = (data) => {
        setRegisteredProsumer(data);
        localStorage.setItem("solarix_prosumer_pending", JSON.stringify(data));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Forgets the remembered registration so the form shows again.
    const handleReset = () => {
        setRegisteredProsumer(null);
        localStorage.removeItem("solarix_prosumer_pending");
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Top Minimal Header */}
            <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-sm">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-lg font-black text-foreground">Solarix</span>
                            <span className="ml-1.5 text-xs font-bold text-primary-dark bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Prosumer Portal
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsStatusModalOpen(true)}
                            className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Check Status</span>
                        </button>

                        <Link
                            to="/login"
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl"
                        >
                            Staff Login
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {registeredProsumer ? (
                        /* Show Pending Approval View with Mobile QR */
                        <PendingApprovalView
                            prosumer={registeredProsumer}
                            onReset={handleReset}
                        />
                    ) : (
                        /* Two-column layout: Guide/QR preview on left, Register form on right */
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Left Info Column */}
                            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
                                    <div className="space-y-2">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                            Step 1 of 3
                                        </span>
                                        <h2 className="text-xl font-black text-foreground">
                                            Join as a Microgrid Prosumer
                                        </h2>
                                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                            Register your rooftop solar array to start feeding surplus clean energy into Colombo’s community microgrid.
                                        </p>
                                    </div>

                                    <div className="space-y-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
                                        <div className="flex items-start gap-2.5">
                                            <span className="w-5 h-5 rounded-full bg-amber-100 text-primary flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                                            <p><strong>Submit Inverter Specs:</strong> Enter your solar capacity (kW), property address, and NIC.</p>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-secondary flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                                            <p><strong>Backoffice Verification:</strong> Engineers approve your grid connection safely.</p>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                                            <p><strong>Scan & Trade:</strong> Use the Android Mobile App to scan QR codes at microgrid hubs.</p>
                                        </div>
                                    </div>

                                    {/* Mobile App Download Card */}
                                    <div className="pt-4 border-t border-slate-100 text-center space-y-3">
                                        <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                                            Download Android App
                                        </p>
                                        <div className="inline-block p-2 bg-slate-50 rounded-xl border border-slate-200">
                                            <QRCodeWidget size={120} label="" sublabel="" showScanCorners={false} />
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            Scan to download the APK now
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 space-y-1">
                                    <p className="font-bold flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Already registered?
                                    </p>
                                    <p className="text-slate-600">
                                        You can{" "}
                                        <button
                                            type="button"
                                            onClick={() => setIsStatusModalOpen(true)}
                                            className="text-primary font-bold underline hover:text-primary-dark"
                                        >
                                            check your approval status
                                        </button>{" "}
                                        using your NIC number anytime.
                                    </p>
                                </div>
                            </div>

                            {/* Right Form Column */}
                            <div className="lg:col-span-8">
                                <ProsumerRegisterForm onSuccess={handleSuccess} />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
                <p>© {new Date().getFullYear()} Solarix Microgrid Energy Operations. Group 45.</p>
            </footer>

            {/* Status Check Modal */}
            <StatusCheckModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
            />
        </div>
    );
}
