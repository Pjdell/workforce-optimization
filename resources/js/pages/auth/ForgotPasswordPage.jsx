import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import AuthLayout from '../../layouts/AuthLayout';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        try {
            await api.post('/forgot-password', { email });
            setSent(true);
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                setErrors(data.errors);
            } else {
                setErrors({ general: data?.message || 'Failed to send reset link.' });
            }
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <AuthLayout title="Check your email" subtitle="We've sent a password reset link">
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} className="text-emerald-400" />
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                        If an account exists for <strong className="text-white">{email}</strong>, you'll receive a password reset link shortly.
                    </p>
                    <p className="text-xs text-gray-500 mb-6">
                        Check your spam folder if you don't see the email.
                    </p>
                    <button
                        onClick={() => { setSent(false); setEmail(''); }}
                        className="text-sm text-[#e07a4f] hover:text-[#c85f31] font-medium transition-colors"
                    >
                        Send another link
                    </button>
                </div>
                <p className="text-center text-sm text-gray-400 mt-6">
                    <Link to="/login" className="text-[#e07a4f] hover:text-[#c85f31] font-medium transition-colors inline-flex items-center gap-1">
                        <ArrowLeft size={14} />
                        Back to login
                    </Link>
                </p>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Forgot password?" subtitle="Enter your email to receive a reset link">
            <form onSubmit={handleSubmit} className="space-y-5">
                {errors.general && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-300">
                        {errors.general}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c85f31]/60 focus:ring-1 focus:ring-[#c85f31]/30 transition-colors"
                        placeholder="you@company.com"
                        required
                        autoFocus
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email[0]}</p>}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#c85f31] to-[#e07a4f] hover:from-[#b5522a] hover:to-[#d06e43] text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#c85f31]/20 hover:shadow-[#c85f31]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Mail size={18} />
                    )}
                    {loading ? 'Sending...' : 'Send reset link'}
                </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
                <Link to="/login" className="text-[#e07a4f] hover:text-[#c85f31] font-medium transition-colors inline-flex items-center gap-1">
                    <ArrowLeft size={14} />
                    Back to login
                </Link>
            </p>
        </AuthLayout>
    );
}
