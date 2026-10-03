import React, { useState } from "react";
import { checkProsumerStatus } from "../../services/authService";
import QRCodeWidget from "../common/QRCodeWidget";

export default function StatusCheckModal({ isOpen, onClose }) {
    const [identifier, setIdentifier] = useState("");
    const [statusData, setStatusData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    if (!isOpen) return null;

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!identifier.trim()) {
            setErrorMessage("Please enter your NIC or Email address.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");
        setStatusData(null);

        try {
            const data = await checkProsumerStatus(identifier.trim());
            setStatusData(data);
        } catch (err) {
            setErrorMessage(err.message || "No prosumer record found. Please verify your NIC or Email.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setStatusData(null);
        setIdentifier("");
        setErrorMessage("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-rise">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {!statusData ? (
                    /* Search Form */
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-primary border border-amber-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-foreground tracking-tight">
                                Check Registration & Approval Status
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                                Enter the NIC or Email address used during prosumer registration to see if Backoffice has activated your node.
                            </p>
                        </div>

                        {errorMessage && (
                            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                    <path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                                </svg>
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <form onSubmit={handleSearch} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5" htmlFor="status-identifier">
                                    NIC Number or Email Address
                                </label>
                                <input
                                    id="status-identifier"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="e.g. 200012345678 or prosumer@example.com"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all uppercase"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary to-primary-dark hover:brightness-105 active:scale-95 shadow-md shadow-primary/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                        </svg>
                                        <span>Querying Registry...</span>
                                    </>
                                ) : (
                                    <span>Check Status</span>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* Search Result View */
                    <div className="space-y-6 animate-rise">
                        <div className="text-center space-y-2">
                            {statusData.accountStatus === "Active" ? (
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-secondary mb-1">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-primary mb-1">
                                    <svg className="w-7 h-7 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            )}

                            <h3 className="text-xl font-black text-foreground tracking-tight">
                                {statusData.accountStatus === "Active"
                                    ? "Account Approved & Active!"
                                    : "Awaiting Backoffice Approval"}
                            </h3>

                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                {statusData.accountStatus === "Active"
                                    ? "Your solar node has been approved by Backoffice engineers. You can log into the mobile app and start trading."
                                    : "Your application is currently being verified by Backoffice staff for grid safety compliance."}
                            </p>
                        </div>

                        {/* Summary Details */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-semibold">Prosumer:</span>
                                <span className="font-bold text-foreground">{statusData.fullName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-semibold">NIC:</span>
                                <span className="font-mono text-slate-700">{statusData.nic}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-semibold">Email:</span>
                                <span className="text-slate-700">{statusData.email}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                <span className="text-slate-500 font-bold uppercase text-[10px]">Current Status:</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    statusData.accountStatus === "Active"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800"
                                }`}>
                                    {statusData.accountStatus}
                                </span>
                            </div>
                        </div>

                        {/* Mobile App QR Reminder */}
                        <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center gap-4">
                            <div className="bg-white p-2 rounded-xl shrink-0">
                                <QRCodeWidget size={90} label="" sublabel="" showScanCorners={false} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-amber-400 uppercase">
                                    Solarix Mobile APK
                                </p>
                                <p className="text-[11px] text-slate-300 leading-tight">
                                    Scan QR with phone to download the prosumer application.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="text-xs font-bold text-primary hover:underline"
                            >
                                Check another account
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
