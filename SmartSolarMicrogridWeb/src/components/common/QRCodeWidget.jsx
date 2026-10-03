import React from "react";

/**
 * QRCodeWidget Component
 * 
 * Renders a crisp, high-resolution QR code for the Solarix Prosumer mobile application.
 * If you provide an `imageUrl`, it will display your image; otherwise it renders a
 * beautiful SVG vector QR code complete with position detection patterns and a branded center.
 * 
 * [USER CUSTOMIZATION]:
 * To replace with your custom QR code image, you can pass:
 * <QRCodeWidget imageUrl="/path/to/your/qr-code.png" />
 * or update the default fallback in this file.
 */
export default function QRCodeWidget({
    imageUrl = null,
    size = 180,
    label = "Scan with phone camera",
    sublabel = "Solarix Prosumer App • Android APK",
    className = "",
    showScanCorners = true,
}) {
    return (
        <div className={`flex flex-col items-center text-center ${className}`}>
            <div className="relative p-3.5 bg-white rounded-2xl shadow-lg border border-slate-200/90 group transition-all duration-300 hover:shadow-xl hover:border-primary/40">
                {/* Decorative scanner corner brackets */}
                {showScanCorners && (
                    <>
                        <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-primary rounded-tl-sm pointer-events-none" />
                        <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-primary rounded-tr-sm pointer-events-none" />
                        <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-secondary rounded-bl-sm pointer-events-none" />
                        <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-secondary rounded-br-sm pointer-events-none" />
                    </>
                )}

                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Solarix Mobile App QR Code"
                        style={{ width: size, height: size }}
                        className="object-contain rounded-lg"
                    />
                ) : (
                    /* High-precision SVG QR Code pattern */
                    <svg
                        viewBox="0 0 160 160"
                        style={{ width: size, height: size }}
                        className="rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-label="Solarix App Download QR Code"
                    >
                        {/* QR Background */}
                        <rect width="160" height="160" fill="#FFFFFF" rx="4" />

                        {/* Top-Left Position Detection Pattern */}
                        <rect x="12" y="12" width="38" height="38" rx="6" fill="#0F172A" />
                        <rect x="18" y="18" width="26" height="26" rx="3" fill="#FFFFFF" />
                        <rect x="23" y="23" width="16" height="16" rx="2" fill="#F59E0B" />

                        {/* Top-Right Position Detection Pattern */}
                        <rect x="110" y="12" width="38" height="38" rx="6" fill="#0F172A" />
                        <rect x="116" y="18" width="26" height="26" rx="3" fill="#FFFFFF" />
                        <rect x="121" y="23" width="16" height="16" rx="2" fill="#10B981" />

                        {/* Bottom-Left Position Detection Pattern */}
                        <rect x="12" y="110" width="38" height="38" rx="6" fill="#0F172A" />
                        <rect x="18" y="116" width="26" height="26" rx="3" fill="#FFFFFF" />
                        <rect x="23" y="121" width="16" height="16" rx="2" fill="#F59E0B" />

                        {/* Timing Patterns */}
                        <g fill="#0F172A">
                            <rect x="54" y="22" width="6" height="6" rx="1" />
                            <rect x="66" y="22" width="6" height="6" rx="1" />
                            <rect x="78" y="22" width="6" height="6" rx="1" />
                            <rect x="90" y="22" width="6" height="6" rx="1" />

                            <rect x="22" y="54" width="6" height="6" rx="1" />
                            <rect x="22" y="66" width="6" height="6" rx="1" />
                            <rect x="22" y="78" width="6" height="6" rx="1" />
                            <rect x="22" y="90" width="6" height="6" rx="1" />
                        </g>

                        {/* Data Matrix Modules (Simulated QR Grid for Solarix Mobile APK) */}
                        <g fill="#0F172A">
                            {/* Column 1 */}
                            <rect x="54" y="38" width="6" height="6" rx="1" />
                            <rect x="66" y="38" width="6" height="12" rx="1" />
                            <rect x="84" y="38" width="12" height="6" rx="1" />
                            <rect x="100" y="38" width="6" height="6" rx="1" />

                            {/* Middle horizontal rows */}
                            <rect x="12" y="54" width="6" height="12" rx="1" />
                            <rect x="36" y="54" width="12" height="6" rx="1" />
                            <rect x="54" y="54" width="6" height="6" rx="1" />
                            <rect x="72" y="54" width="12" height="6" rx="1" />
                            <rect x="96" y="54" width="6" height="12" rx="1" />
                            <rect x="110" y="54" width="12" height="6" rx="1" />
                            <rect x="134" y="54" width="14" height="6" rx="1" />

                            {/* Middle band */}
                            <rect x="12" y="72" width="12" height="6" rx="1" />
                            <rect x="30" y="72" width="6" height="6" rx="1" />
                            <rect x="42" y="72" width="6" height="12" rx="1" />
                            <rect x="54" y="66" width="12" height="6" rx="1" />
                            <rect x="96" y="72" width="12" height="6" rx="1" />
                            <rect x="116" y="66" width="6" height="12" rx="1" />
                            <rect x="128" y="72" width="6" height="6" rx="1" />
                            <rect x="140" y="72" width="8" height="6" rx="1" />

                            {/* Center lower modules */}
                            <rect x="54" y="84" width="6" height="12" rx="1" />
                            <rect x="66" y="90" width="12" height="6" rx="1" />
                            <rect x="84" y="84" width="6" height="6" rx="1" />
                            <rect x="96" y="90" width="6" height="12" rx="1" />
                            <rect x="110" y="84" width="12" height="6" rx="1" />
                            <rect x="128" y="84" width="6" height="12" rx="1" />
                            <rect x="140" y="90" width="8" height="6" rx="1" />

                            {/* Lower rows */}
                            <rect x="54" y="110" width="12" height="6" rx="1" />
                            <rect x="72" y="110" width="6" height="6" rx="1" />
                            <rect x="84" y="110" width="12" height="12" rx="1" />
                            <rect x="102" y="110" width="18" height="6" rx="1" />
                            <rect x="126" y="110" width="6" height="6" rx="1" />
                            <rect x="138" y="110" width="10" height="6" rx="1" />

                            <rect x="54" y="122" width="6" height="12" rx="1" />
                            <rect x="66" y="128" width="12" height="6" rx="1" />
                            <rect x="102" y="122" width="6" height="12" rx="1" />
                            <rect x="114" y="128" width="12" height="6" rx="1" />
                            <rect x="132" y="122" width="16" height="14" rx="1" />

                            <rect x="54" y="140" width="18" height="6" rx="1" />
                            <rect x="78" y="138" width="6" height="8" rx="1" />
                            <rect x="90" y="140" width="12" height="6" rx="1" />
                            <rect x="108" y="138" width="12" height="8" rx="1" />
                        </g>

                        {/* Central Branded Micro-Badge */}
                        <rect x="65" y="65" width="30" height="30" rx="8" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2.5" />
                        <circle cx="80" cy="80" r="10" fill="#F59E0B" />
                        {/* Lightning bolt inside logo */}
                        <path
                            d="M81.5 73.5 L75.5 80 H79.5 L78 86.5 L84.5 80 H80.5 Z"
                            fill="#FFFFFF"
                        />
                    </svg>
                )}

                {/* Subdued scan pulse bar */}
                <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none animate-pulse" />
            </div>

            {/* Labels */}
            {label && (
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                    {label}
                </p>
            )}
            {sublabel && (
                <p className="text-[11px] text-muted font-medium">
                    {sublabel}
                </p>
            )}
        </div>
    );
}
