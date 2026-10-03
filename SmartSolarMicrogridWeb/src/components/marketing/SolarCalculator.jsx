import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SolarCalculator() {
    const [capacityKw, setCapacityKw] = useState(5.0);
    const navigate = useNavigate();

    // Standard Sri Lanka / Tropical solar calculations:
    // ~4.5 Peak Sun Hours per day
    const dailyKwh = (capacityKw * 4.5).toFixed(1);
    const monthlyKwh = (capacityKw * 4.5 * 30).toFixed(0);
    // Base feed-in tariff of ~LKR 42.00 per surplus kWh
    const monthlyEarnings = (monthlyKwh * 42).toLocaleString();
    // 0.85 kg CO2 offset per kWh solar
    const monthlyCo2 = (monthlyKwh * 0.85).toFixed(0);

    const handleRegisterWithCapacity = () => {
        navigate(`/register?capacity=${capacityKw}`);
    };

    return (
        <section id="calculator" className="py-20 bg-white border-y border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Heading */}
                <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-primary bg-amber-50 border border-amber-200">
                        Interactive Estimator
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                        Calculate Your Rooftop Solar Potential
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base">
                        See how much surplus solar electricity your rooftop panels can generate, feed into the microgrid, and monetize each month.
                    </p>
                </div>

                {/* Calculator Card */}
                <div className="max-w-4xl mx-auto bg-slate-50/80 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Slider Controls */}
                        <div className="lg:col-span-7 space-y-6">
                            <div>
                                <div className="flex justify-between items-baseline mb-3">
                                    <label htmlFor="capacity-range" className="text-sm font-bold text-foreground uppercase tracking-wider">
                                        Solar PV Inverter Capacity
                                    </label>
                                    <span className="text-2xl font-black text-primary">
                                        {capacityKw} <span className="text-base font-semibold text-slate-500">kW</span>
                                    </span>
                                </div>

                                <input
                                    id="capacity-range"
                                    type="range"
                                    min="1.0"
                                    max="30.0"
                                    step="0.5"
                                    value={capacityKw}
                                    onChange={(e) => setCapacityKw(parseFloat(e.target.value))}
                                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                />

                                <div className="flex justify-between text-xs font-medium text-slate-400 mt-2">
                                    <span>1 kW (Small Home)</span>
                                    <span>10 kW (Large Villa)</span>
                                    <span>30 kW (Commercial)</span>
                                </div>
                            </div>

                            {/* Preset Buttons */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Quick Presets:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {[3.0, 5.0, 7.5, 10.0, 15.0, 20.0].map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setCapacityKw(preset)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                capacityKw === preset
                                                    ? "bg-primary text-white shadow-xs"
                                                    : "bg-white text-slate-700 border border-slate-200 hover:border-primary/50"
                                            }`}
                                        >
                                            {preset} kW
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* System Tech Notes */}
                            <div className="p-4 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                                <p className="font-bold text-foreground flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Technical Tie-in Notice
                                </p>
                                <p>
                                    All rooftop inverters registered on Solarix Microgrid undergo verification by Backoffice engineers to ensure local grid sync, reverse-power safety, and voltage regulation.
                                </p>
                            </div>
                        </div>

                        {/* Results Summary Box */}
                        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-7 rounded-2xl shadow-lg space-y-5">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Estimated Monthly Grid Earnings
                                </p>
                                <p className="text-3xl font-black text-amber-400 mt-1">
                                    LKR {monthlyEarnings}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Based on ~{monthlyKwh} kWh monthly production
                                </p>
                            </div>

                            <div className="border-t border-slate-700/80 pt-4 space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-300">Daily Generation</span>
                                    <span className="font-bold text-white">~{dailyKwh} kWh / day</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-300">Clean CO₂ Offset</span>
                                    <span className="font-bold text-emerald-400">~{monthlyCo2} kg / month</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-300">Estimated Battery Storage Buffer</span>
                                    <span className="font-bold text-white">{(capacityKw * 2.2).toFixed(1)} kWh Hub Slot</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleRegisterWithCapacity}
                                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-900 bg-primary hover:bg-amber-400 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>Register {capacityKw} kW System</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
