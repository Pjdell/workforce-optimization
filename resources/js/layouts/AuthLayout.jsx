import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ children, title }) {
    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white relative overflow-hidden">

            {/* Left Column: Image with Gradient Overlay & Curved Edge */}
            <div className="relative w-full lg:w-1/2 min-h-[400px] lg:min-h-screen flex flex-col justify-between p-8 lg:p-16 text-white overflow-hidden">

                {/* Background image */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/globalcity.jpg')" }}
                />

                {/* orange overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#c85f31]/85 " />

                {/* Curved S-divider (Visible on Desktop) */}
                <div className="hidden lg:block absolute top-0 bottom-0 -right-[1px] w-24 h-full pointer-events-none z-10">
                    <svg
                        className="w-full h-full text-white fill-current"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                    >
                        <path d="M0,0 C60,20 20,80 100,100 L100,0 Z" />
                    </svg>
                </div>

                {/* Top/Center Branding Content */}
                <div className="relative z-10 my-auto max-w-md">
                    <Link to="/" className="inline-block mb-6">
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-wider uppercase">
                            WorkForce Optimizer
                        </h1>
                    </Link>
                    <p className="text-sm lg:text-base text-white/80 leading-relaxed">
                        Put the right people where they matter most. Optimize your workforce based on skills, availability, workload, and project needs.

                    </p>
                </div>

                {/* Social / Footer Icons */}

            </div>

            {/* Right Column: Form Area */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 z-20">
                <div className="w-full max-w-md">
                    {title && (
                        <h2 className="text-lg font-bold text-gray-700 tracking-wider uppercase mb-8">
                            {title}
                        </h2>
                    )}

                    {/* Form Content Passed as Children */}
                    <div className="w-full">
                        {children}
                    </div>
                </div>
            </div>

        </div>
    );
}