import React, { useState } from "react";
import Navbar from "../components/marketing/Navbar";
import HeroSection from "../components/marketing/HeroSection";
import FeaturesSection from "../components/marketing/FeaturesSection";
import SolarCalculator from "../components/marketing/SolarCalculator";
import HowItWorksSection from "../components/marketing/HowItWorksSection";
import MobileAppSection from "../components/marketing/MobileAppSection";
import Footer from "../components/marketing/Footer";
import ProsumerRegisterForm from "../components/prosumer/ProsumerRegisterForm";
import PendingApprovalView from "../components/prosumer/PendingApprovalView";
import StatusCheckModal from "../components/prosumer/StatusCheckModal";

export default function HomePage() {
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [registeredProsumer, setRegisteredProsumer] = useState(() => {
        const cached = localStorage.getItem("solarix_prosumer_pending");
        return cached ? JSON.parse(cached) : null;
    });

    const handleRegistrationSuccess = (prosumerData) => {
        setRegisteredProsumer(prosumerData);
        localStorage.setItem("solarix_prosumer_pending", JSON.stringify(prosumerData));
        // Smooth scroll to the registration card area
        const section = document.getElementById("register-section");
        if (section) section.scrollIntoView({ behavior: "smooth" });
    };

    const handleResetRegistration = () => {
        setRegisteredProsumer(null);
        localStorage.removeItem("solarix_prosumer_pending");
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary-dark">
            {/* Top Navigation */}
            <Navbar onOpenStatusModal={() => setIsStatusModalOpen(true)} />

            {/* Main Marketing Content */}
            <main className="flex-grow">
                {/* 1. Hero Pitch */}
                <HeroSection onOpenStatusModal={() => setIsStatusModalOpen(true)} />

                {/* 2. Core Prosumer Benefits */}
                <FeaturesSection />

                {/* 3. Interactive Solar Calculator */}
                <SolarCalculator />

                {/* 4. Onboarding Process */}
                <HowItWorksSection />

                {/* 5. Direct Registration Section */}
                <section id="register-section" className="py-20 bg-slate-50 border-t border-slate-200/80">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {registeredProsumer ? (
                            <PendingApprovalView
                                prosumer={registeredProsumer}
                                onReset={handleResetRegistration}
                            />
                        ) : (
                            <ProsumerRegisterForm
                                onSuccess={handleRegistrationSuccess}
                            />
                        )}
                    </div>
                </section>

                {/* 6. Native Mobile App & QR Download Section */}
                <MobileAppSection />
            </main>

            {/* Footer */}
            <Footer onOpenStatusModal={() => setIsStatusModalOpen(true)} />

            {/* Status Lookup Modal */}
            <StatusCheckModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
            />
        </div>
    );
}
