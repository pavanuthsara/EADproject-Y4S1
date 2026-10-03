import React, { useState } from "react";
import { Link } from "react-router-dom";
import QRCodeWidget from "../common/QRCodeWidget";
import { checkProsumerStatus } from "../../services/authService";

export default function PendingApprovalView({
    prosumer,
    onReset,
    qrCodeImageUrl = null, // [USER CUSTOMIZATION]: You can pass your own QR image URL here
}) {
    const [liveStatus, setLiveStatus] = useState(prosumer?.accountStatus || "Pending");
    const [isChecking, setIsChecking] = useState(false);
    const [checkMessage, setCheckMessage] = useState("");

    const handleCheckLiveStatus = async () => {
        if (!prosumer?.nic) return;
        setIsChecking(true);
        setCheckMessage("");

        try {
            const data = await checkProsumerStatus(prosumer.nic);
            if (data && data.accountStatus) {
                setLiveStatus(data.accountStatus);
                if (data.accountStatus === "Active") {
                    setCheckMessage("Congratulations! Your account has been approved and activated by Backoffice!");
                } else {
                    setCheckMessage("Your registration is still under review by our Backoffice engineering team.");
                }
            }
        } catch {
            setCheckMessage("Status checked: Still awaiting Backoffice approval.");
        } finally {
            setIsChecking(false);
        }
    };

    const isNowActive = liveStatus === "Active";

    return (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-10 max-w-3xl mx-auto space-y-8 animate-rise">
            {/* Header / Status Banner */}
            <div className="text-center space-y-3">
                {isNowActive ? (
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-secondary mb-2 animate-bounce">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                ) : (
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-primary mb-2">
                        <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                )}

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border">
                    {isNowActive ? (
                        <span className="text-emerald-700 bg-emerald-50 border-emerald-200">
                            🟢 Account Status: Active & Approved
                        </span>
                    ) : (
                        <span className="text-amber-800 bg-amber-50 border-amber-200">
                            🟡 Account Status: Pending Backoffice Approval
                        </span>
                    )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    {isNowActive ? "Your Node is Fully Activated!" : "Registration Received — Awaiting Approval"}
                </h2>

                <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                    {isNowActive ? (
                        "Your prosumer account has been officially verified and activated by our Backoffice team. You can now log into the Solarix mobile app to begin energy reservations and solar dispatching."
                    ) : (
                        "Thank you for registering your solar system with Solarix Microgrid! For neighborhood safety and electrical grid compliance, a Backoffice Administrator must review your inverter specifications and activate your account. You will be notified once approval is complete."
                    )}
                </p>
            </div>

            {/* Registered Details Summary Card */}
            <div className="bg-slate-50/90 rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Prosumer Registration Record
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-500">
                        NIC: {prosumer?.nic || "—"}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div>
                        <span className="text-slate-400 block text-[11px] font-semibold uppercase">Prosumer Name</span>
                        <span className="font-bold text-foreground">{prosumer?.fullName || "—"}</span>
                    </div>

                    <div>
                        <span className="text-slate-400 block text-[11px] font-semibold uppercase">Email Address</span>
                        <span className="font-bold text-foreground">{prosumer?.email || "—"}</span>
                    </div>

                    <div>
                        <span className="text-slate-400 block text-[11px] font-semibold uppercase">Solar PV Inverter</span>
                        <span className="font-bold text-primary">{prosumer?.solarCapacityKw || 0} kW Rated</span>
                    </div>

                    <div>
                        <span className="text-slate-400 block text-[11px] font-semibold uppercase">Contact Phone</span>
                        <span className="font-bold text-foreground">{prosumer?.phone || "—"}</span>
                    </div>

                    {prosumer?.address && (
                        <div className="sm:col-span-2">
                            <span className="text-slate-400 block text-[11px] font-semibold uppercase">Installation Address</span>
                            <span className="font-medium text-slate-700">{prosumer.address}</span>
                        </div>
                    )}
                </div>

                {/* Live Check Button */}
                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-500">
                        {checkMessage || "Want to verify if Backoffice has approved you yet?"}
                    </p>
                    <button
                        type="button"
                        onClick={handleCheckLiveStatus}
                        disabled={isChecking}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs flex items-center gap-1.5"
                    >
                        {isChecking ? (
                            <>
                                <svg className="animate-spin h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                </svg>
                                <span>Checking...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Refresh Approval Status</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile App Download Card with Prominent QR Code */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700 relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    {/* Left pitch */}
                    <div className="md:col-span-7 space-y-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            Next Step: Mobile Setup
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                            Download the Solarix Prosumer Mobile App
                        </h3>

                        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                            While your grid interconnection is reviewed, install our native Android mobile app. Once approved, use your registered credentials to sign in, monitor solar telemetry, and dispatch energy via QR codes.
                        </p>

                        <div className="space-y-2 pt-1 text-xs text-slate-300 font-medium">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                                <span>Real-time rooftop solar generation charts</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                                <span>Microgrid battery storage slot reservations</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                                <span>Contactless transfer QR tokens for Grid Operators</span>
                            </div>
                        </div>
                    </div>

                    {/* Right QR Code Graphic */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center">
                        <div className="bg-white p-3.5 rounded-2xl shadow-xl flex flex-col items-center">
                            <QRCodeWidget
                                imageUrl={qrCodeImageUrl}
                                size={170}
                                label=""
                                sublabel=""
                                showScanCorners={true}
                            />
                        </div>
                        <p className="mt-3 text-xs font-bold text-white uppercase tracking-wider">
                            Scan with Phone Camera
                        </p>
                        <p className="text-[11px] text-slate-400">
                            Solarix Mobile APK for Android
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <Link
                    to="/"
                    className="text-xs font-bold text-slate-600 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Home</span>
                </Link>

                <div className="flex items-center gap-3">
                    {onReset && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            Register Another System
                        </button>
                    )}

                    <Link
                        to="/login"
                        className="px-4 py-2 text-xs font-bold rounded-xl text-primary-dark bg-primary-soft hover:bg-amber-200 transition-colors"
                    >
                        Staff Login Portal
                    </Link>
                </div>
            </div>
        </div>
    );
}
