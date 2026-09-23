import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../layouts/AuthLayout';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '', remember: false });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        try {
            await login(form.email, form.password, form.remember);
            navigate('/dashboard');
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                setErrors(data.errors);
            } else {
                setErrors({ general: data?.message || 'Login failed. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Welcome back" subtitle="Sign in to your account">
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
                        className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#c85f31]/60 focus:ring-1 focus:ring-[#c85f31]/30 transition-colors"
                        placeholder="you@company.com"
                        required
                        autoFocus
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email[0]}</p>}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-gray-300">Password</label>
                        <Link to="/forgot-password" className="text-xs text-[#e07a4f] hover:text-[#c85f31] transition-colors">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c85f31]/60 focus:ring-1 focus:ring-[#c85f31]/30 transition-colors"
                            placeholder="••••••••"
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

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="remember"
                        checked={form.remember}
                        onChange={e => setForm({ ...form, remember: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-white/[0.06] text-[#c85f31] focus:ring-[#c85f31]/30"
                    />
                    <label htmlFor="remember" className="text-sm text-gray-400">Remember me</label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#c85f31] to-[#e07a4f] hover:from-[#b5522a] hover:to-[#d06e43] text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#c85f31]/20 hover:shadow-[#c85f31]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <LogIn size={18} />
                    )}
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#e07a4f] hover:text-[#c85f31] font-medium transition-colors">
                    Create one
                </Link>
            </p>
        </AuthLayout>
    );
}
