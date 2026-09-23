import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../layouts/AuthLayout';
import { Eye, EyeOff, UserCheck, Loader2, AlertTriangle } from 'lucide-react';

export default function AcceptInvitationPage() {
    const { token } = useParams();
    const { fetchUser } = useAuth();
    const navigate = useNavigate();
    const [invitation, setInvitation] = useState(null);
    const [verifying, setVerifying] = useState(true);
    const [verifyError, setVerifyError] = useState(null);
    const [form, setForm] = useState({
        name: '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await api.get(`/invitations/verify/${token}`);
                setInvitation(res.data);
            } catch (err) {
                setVerifyError(err.response?.data?.message || 'Invalid invitation link.');
            } finally {
                setVerifying(false);
            }
        };
        verify();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        try {
            // Get CSRF cookie first
            await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
            await api.post('/invitations/accept', {
                token,
                ...form,
            });
            await fetchUser();
            navigate('/dashboard');
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                setErrors(data.errors);
            } else {
                setErrors({ general: data?.message || 'Failed to accept invitation.' });
            }
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <AuthLayout title="Verifying invitation..." subtitle="Please wait">
                <div className="flex justify-center py-8">
                    <Loader2 size={32} className="animate-spin text-[#c85f31]" />
                </div>
            </AuthLayout>
        );
    }

    if (verifyError) {
        return (
            <AuthLayout title="Invalid invitation" subtitle="This invitation link is not valid">
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-red-400" />
                    </div>
                    <p className="text-sm text-gray-300 mb-6">{verifyError}</p>
                    <Link
                        to="/login"
                        className="text-sm text-[#e07a4f] hover:text-[#c85f31] font-medium transition-colors"
                    >
                        Go to login
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title={`Join ${invitation.organization_name}`}
            subtitle="Create your account to get started"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {errors.general && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-300">
                        {errors.general}
                    </div>
                )}

                {/* Pre-filled email (read-only) */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                    <input
                        type="email"
                        value={invitation.email}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed"
                        disabled
                    />
                    <p className="mt-1 text-xs text-gray-500">This email was used for your invitation</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c85f31]/60 focus:ring-1 focus:ring-[#c85f31]/30 transition-colors"
                        placeholder="Your full name"
                        required
                        autoFocus
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name[0]}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
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

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#c85f31] to-[#e07a4f] hover:from-[#b5522a] hover:to-[#d06e43] text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#c85f31]/20 hover:shadow-[#c85f31]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <UserCheck size={18} />
                    )}
                    {loading ? 'Creating account...' : 'Accept & join'}
                </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-[#e07a4f] hover:text-[#c85f31] font-medium transition-colors">
                    Sign in
                </Link>
            </p>
        </AuthLayout>
    );
}
