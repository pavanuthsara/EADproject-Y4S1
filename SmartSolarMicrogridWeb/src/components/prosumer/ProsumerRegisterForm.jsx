import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { registerProsumer } from "../../services/authService";

export default function ProsumerRegisterForm({ onSuccess }) {
    const location = useLocation();

    // Form inputs state
    const [formData, setFormData] = useState({
        fullName: "",
        nic: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        address: "",
        solarCapacityKw: 5.0,
        agreeTerms: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Read capacity from URL query parameter if passed from calculator
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const capacityParam = params.get("capacity");
        if (capacityParam) {
            const parsed = parseFloat(capacityParam);
            if (!isNaN(parsed) && parsed > 0) {
                setFormData((prev) => ({ ...prev, solarCapacityKw: parsed }));
            }
        }
    }, [location.search]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        // Clear field error on change
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: "" }));
        }
        if (serverError) setServerError("");
    };

    // Client-side validation matching .NET RegisterRequestDto annotations
    const validate = () => {
        const errors = {};

        if (!formData.fullName.trim()) {
            errors.fullName = "Full name is required.";
        } else if (formData.fullName.trim().length < 2 || formData.fullName.trim().length > 100) {
            errors.fullName = "Full name must be between 2 and 100 characters.";
        }

        const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
        if (!formData.nic.trim()) {
            errors.nic = "National Identity Card (NIC) is required.";
        } else if (!nicRegex.test(formData.nic.trim()) && (formData.nic.trim().length < 10 || formData.nic.trim().length > 12)) {
            errors.nic = "NIC must be 10–12 characters (e.g. 199912345678 or 991234567V).";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            errors.email = "Email address is required.";
        } else if (!emailRegex.test(formData.email.trim())) {
            errors.email = "Please enter a valid email address.";
        }

        const phoneRegex = /^[0-9+ -]{9,15}$/;
        if (!formData.phone.trim()) {
            errors.phone = "Phone number is required.";
        } else if (!phoneRegex.test(formData.phone.trim())) {
            errors.phone = "Enter a valid contact phone number (e.g. 0771234567).";
        }

        if (!formData.address.trim()) {
            errors.address = "Property / Solar installation address is required.";
        } else if (formData.address.trim().length > 250) {
            errors.address = "Address cannot exceed 250 characters.";
        }

        const capacity = parseFloat(formData.solarCapacityKw);
        if (isNaN(capacity) || capacity <= 0 || capacity > 1000) {
            errors.solarCapacityKw = "Solar PV capacity must be between 0.1 and 1000 kW.";
        }

        if (!formData.password) {
            errors.password = "Password is required.";
        } else if (formData.password.length < 8) {
            errors.password = "Password must be at least 8 characters.";
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match.";
        }

        if (!formData.agreeTerms) {
            errors.agreeTerms = "You must confirm grid safety & interconnection compliance.";
        }

        return errors;
    };

    // Calculate password strength score (0-4)
    const getPasswordStrength = (pwd) => {
        if (!pwd) return 0;
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    };

    const strength = getPasswordStrength(formData.password);
    const strengthLabels = ["Very Weak", "Weak", "Medium", "Good", "Strong"];
    const strengthColors = ["bg-slate-200", "bg-red-500", "bg-amber-500", "bg-yellow-500", "bg-emerald-500"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validate();

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            // Scroll to the first error
            return;
        }

        setIsSubmitting(true);
        setServerError("");

        try {
            const payload = {
                fullName: formData.fullName.trim(),
                nic: formData.nic.trim().toUpperCase(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                password: formData.password,
                address: formData.address.trim(),
                solarCapacityKw: parseFloat(formData.solarCapacityKw),
            };

            const result = await registerProsumer(payload);

            // Pass the registered details up to show the pending screen
            if (onSuccess) {
                onSuccess({
                    ...result,
                    nic: payload.nic,
                    fullName: payload.fullName,
                    email: payload.email,
                    phone: payload.phone,
                    address: payload.address,
                    solarCapacityKw: payload.solarCapacityKw,
                    submittedAt: new Date().toISOString(),
                });
            }
        } catch (err) {
            setServerError(err.message || "Registration failed. Please check your network and inputs.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-10 max-w-3xl mx-auto">
            {/* Form Header */}
            <div className="text-center mb-8 space-y-2">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-primary bg-amber-50 border border-amber-200 inline-block">
                    Solar Prosumer Onboarding
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    Register Your Solar PV System
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto">
                    Fill in your identity and installation details. Your registration will be securely sent to our Backoffice engineers for grid activation.
                </p>
            </div>

            {/* Global Server Error Banner */}
            {serverError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
                    <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                    </svg>
                    <div>
                        <p className="font-bold">Submission Error</p>
                        <p>{serverError}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* Section 1: Prosumer Identity */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">1</span>
                        Personal & Contact Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div>
                            <label className="block text-xs font-bold text-foreground mb-1.5" htmlFor="fullName">
                                Full Legal Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="e.g. Kasun Chamara Perera"
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-foreground bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                                    fieldErrors.fullName ? "border-red-400 bg-red-50/30" : "border-slate-200"
                                }`}
                            />
                            {fieldErrors.fullName && (
                                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.fullName}</p>
                            )}
                        </div>

                        {/* NIC */}
                        <div>
                            <label className="block text-xs font-bold text-foreground mb-1.5" htmlFor="nic">
                                NIC (National Identity Card) <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="nic"
                                type="text"
                                name="nic"
                                value={formData.nic}
                                onChange={handleInputChange}
                                placeholder="e.g. 200012345678 or 981234567V"
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-foreground bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all uppercase ${
                                    fieldErrors.nic ? "border-red-400 bg-red-50/30" : "border-slate-200"
                                }`}
                            />
                            {fieldErrors.nic && (
                                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.nic}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-foreground mb-1.5" htmlFor="email">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="prosumer@example.com"
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-foreground bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                                    fieldErrors.email ? "border-red-400 bg-red-50/30" : "border-slate-200"
                                }`}
                            />
                            {fieldErrors.email && (
                                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.email}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-xs font-bold text-foreground mb-1.5" htmlFor="phone">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="0771234567"
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-foreground bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                                    fieldErrors.phone ? "border-red-400 bg-red-50/30" : "border-slate-200"
                                }`}
                            />
                            {fieldErrors.phone && (
                                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.phone}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 2: Technical Installation & Solar Specs */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-[10px] font-black">2</span>
                        Solar PV & Grid Connection Details
                    </h3>

                    {/* Solar PV Capacity */}
                    <div>
                        <div className="flex justify-between items-baseline mb-1.5">
                            <label className="block text-xs font-bold text-foreground" htmlFor="solarCapacityKw">
                                Rooftop Solar PV Inverter Capacity (kW) <span className="text-red-500">*</span>
                            </label>
                            <span className="text-xs font-bold text-primary">
                                {formData.solarCapacityKw} kW Rated
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                id="solarCapacityKw"
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="1000"
                                name="solarCapacityKw"
                                value={formData.solarCapacityKw}
                                onChange={handleInputChange}
                                className={`w-36 px-3.5 py-2.5 rounded-xl border text-sm font-bold text-foreground bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                                    fieldErrors.solarCapacityKw ? "border-red-400 bg-red-50/30" : "border-slate-200"
                                }`}
                            />

                            {/* Preset Buttons */}
                            <div className="flex flex-wrap gap-1.5">
                                {[3.0, 5.0, 8.0, 10.0, 15.0].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setFormData((prev) => ({ ...prev, solarCapacityKw: preset }))}
                                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                            parseFloat(formData.solarCapacityKw) === preset
                                                ? "bg-primary text-white border-primary"
                                                : "bg-slate-50 text-slate-600 border-slate-200 hover:border-primary/50"
                                        }`}
                                    >
                                        {preset} kW
                                    </button>
                                ))}
                            </div>
                        </div>
                        {fieldErrors.solarCapacityKw && (
                            <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.solarCapacityKw}</p>
                        )}
                    </div>

                    {/* Installation Address */}
                    <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5" htmlFor="address">
                            Installation & Property Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="address"
                            name="address"
                            rows={2}
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="e.g. 142/B, Flower Road, Colombo 07"
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-foreground bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                                fieldErrors.address ? "border-red-400 bg-red-50/30" : "border-slate-200"
                            }`}
                        />
                        {fieldErrors.address && (
                            <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.address}</p>
                        )}
                    </div>
                </div>

                {/* Section 3: Account Security */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">3</span>
                        Mobile & Web Account Security
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Password */}
                        <div>
                            <div className="flex justify-between items-baseline mb-1.5">
                                <label className="block text-xs font-bold text-foreground" htmlFor="password">
                                    Account Password <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-[11px] font-semibold text-primary hover:underline"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="At least 8 characters"
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-foreground bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                                    fieldErrors.password ? "border-red-400 bg-red-50/30" : "border-slate-200"
                                }`}
                            />

                            {/* Password strength bar */}
                            {formData.password && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex h-1.5 w-full rounded-full bg-slate-100 overflow-hidden gap-1">
                                        {[1, 2, 3, 4].map((step) => (
                                            <div
                                                key={step}
                                                className={`h-full flex-1 transition-all ${
                                                    strength >= step ? strengthColors[strength] : "bg-slate-200"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                                        <span>Strength</span>
                                        <span>{strengthLabels[strength]}</span>
                                    </div>
                                </div>
                            )}

                            {fieldErrors.password && (
                                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.password}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-bold text-foreground mb-1.5" htmlFor="confirmPassword">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="Re-enter your password"
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-foreground bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                                    fieldErrors.confirmPassword ? "border-red-400 bg-red-50/30" : "border-slate-200"
                                }`}
                            />
                            {fieldErrors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.confirmPassword}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            name="agreeTerms"
                            checked={formData.agreeTerms}
                            onChange={handleInputChange}
                            className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/40 accent-primary"
                        />
                        <span className="text-xs text-slate-600 leading-relaxed">
                            I declare that the rooftop solar PV inverter information provided is accurate, meets utility interconnection safety requirements, and I agree to await verification and approval from the <strong>Solarix Backoffice Operations</strong> team before energization.
                        </span>
                    </label>
                    {fieldErrors.agreeTerms && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.agreeTerms}</p>
                    )}
                </div>

                {/* Submit Action */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 px-6 rounded-2xl text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary via-amber-500 to-primary-dark hover:brightness-105 active:scale-95 shadow-lg shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                </svg>
                                <span>Submitting to Microgrid Registry...</span>
                            </>
                        ) : (
                            <>
                                <span>Submit Prosumer Registration</span>
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                    <p className="text-center text-[11px] text-slate-400 mt-3">
                        After registration, your account status will be <strong>Pending Backoffice Approval</strong>.
                    </p>
                </div>
            </form>
        </div>
    );
}
