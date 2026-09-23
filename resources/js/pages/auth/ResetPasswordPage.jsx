import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import AuthLayout from '../../layouts/AuthLayout';
import { Eye, EyeOff, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState({
        email: searchParams.get('email') || '',
        token: searchParams.get('token') || '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        try {
            await api.post('/reset-password', form);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                setErrors(data.errors);
            } else {
                setErrors({ general: data?.message || 'Failed to reset password.' });
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <AuthLayout title="Password reset!" subtitle="Your password has been updated">
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} className="text-emerald-400" />
                    </div>
                    <p className="text-sm text-gray-300 mb-4">
                        Redirecting you to the login page...
                    </p>
                    <Link
                        to="/login"
                        className="text-sm text-[#e07a4f] hover:text-[#c85f31] font-medium transition-colors"
                    >
                        Go to login now
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Reset password" subtitle="Enter your new password">
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
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c85f31]/60 focus:ring-1 focus:ring-[#c85f31]/30 transition-colors"
                        placeholder="you@company.com"
                        required
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email[0]}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c85f31]/60 focus:ring-1 focus:ring-[#c85f31]/30 transition-colors"
                            placeholder="Min. 8 characters"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password[0]}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password_confirmation}
                        onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                        className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c85f31]/60 focus:ring-1 focus:ring-[#c85f31]/30 transition-colors"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <input type="hidden" value={form.token} />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#c85f31] to-[#e07a4f] hover:from-[#b5522a] hover:to-[#d06e43] text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#c85f31]/20 hover:shadow-[#c85f31]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <KeyRound size={18} />
                    )}
                    {loading ? 'Resetting...' : 'Reset password'}
                </button>
            </form>
        </AuthLayout>
    );
}
