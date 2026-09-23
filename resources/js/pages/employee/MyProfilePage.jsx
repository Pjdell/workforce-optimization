import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Save, Plus, X, Loader2, User, Wrench, Clock, Briefcase } from 'lucide-react';

const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

function SkillBadge({ name, level }) {
    const colors = {
        beginner: 'bg-gray-200 text-gray-700',
        intermediate: 'bg-blue-100 text-blue-700',
        advanced: 'bg-purple-100 text-purple-700',
        expert: 'bg-amber-100 text-amber-700',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[level] || colors.beginner}`}>
            {name}
            <span className="ml-1 opacity-60">• {level}</span>
        </span>
    );
}

export default function MyProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [allSkills, setAllSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingSkills, setSavingSkills] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [successMessage, setSuccessMessage] = useState('');

    // Profile form
    const [profileForm, setProfileForm] = useState({
        max_weekly_hours: 40,
        remote_preference: 'hybrid',
        availability_start: '',
        availability_end: '',
    });

    // Skills form
    const [skills, setSkills] = useState([]);

    useEffect(() => {
        fetchProfile();
        fetchSkills();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/my-profile');
            setProfile(res.data);
            setProfileForm({
                max_weekly_hours: res.data.max_weekly_hours || 40,
                remote_preference: res.data.remote_preference || 'hybrid',
                availability_start: res.data.availability_start?.split('T')[0] || '',
                availability_end: res.data.availability_end?.split('T')[0] || '',
            });
            setSkills(
                (res.data.skills || []).map(s => ({
                    skill_id: s.id,
                    proficiency_level: s.pivot?.proficiency_level || 'beginner',
                    years_of_experience: s.pivot?.years_of_experience || 0,
                }))
            );
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSkills = async () => {
        try {
            const res = await api.get('/skills');
            setAllSkills(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put('/my-profile', profileForm);
            setProfile(res.data);
            showSuccess('Profile updated successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving profile');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSkills = async () => {
        setSavingSkills(true);
        try {
            await api.post('/my-profile/skills', { skills });
            await fetchProfile();
            showSuccess('Skills updated successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving skills');
        } finally {
            setSavingSkills(false);
        }
    };

    const addSkillRow = () => {
        const usedIds = skills.map(s => s.skill_id);
        const available = allSkills.filter(s => !usedIds.includes(s.id));
        if (available.length === 0) return;
        setSkills([...skills, { skill_id: available[0].id, proficiency_level: 'beginner', years_of_experience: 0 }]);
    };

    const removeSkillRow = (index) => {
        setSkills(skills.filter((_, i) => i !== index));
    };

    const updateSkillRow = (index, field, value) => {
        const updated = [...skills];
        updated[index] = {
            ...updated[index],
            [field]: field === 'years_of_experience' ? parseFloat(value) || 0 : field === 'skill_id' ? parseInt(value) : value,
        };
        setSkills(updated);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-[#c85f31]" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">No employee profile found. Please contact your administrator.</p>
            </div>
        );
    }

    const tabs = [
        { id: 'profile', label: 'Profile & Availability', icon: User },
        { id: 'skills', label: 'Skills', icon: Wrench },
        { id: 'allocations', label: 'My Allocations', icon: Briefcase },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                <p className="text-sm text-[#6e826a] mt-1">
                    Manage your skills, availability, and preferences
                </p>
            </div>

            {/* Success toast */}
            {successMessage && (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 animate-[fadeIn_0.2s_ease-out]">
                    ✓ {successMessage}
                </div>
            )}

            {/* Profile summary card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#c85f31] to-[#e07a4f] flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-[#c85f31]/20">
                        {profile.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{profile.name}</h3>
                        <p className="text-sm text-[#6e826a]">{profile.role} • {profile.department}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Utilization</div>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        profile.utilization_percentage > 100 ? 'bg-red-500' :
                                        profile.utilization_percentage > 90 ? 'bg-yellow-500' :
                                        profile.utilization_percentage > 70 ? 'bg-yellow-400' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(100, profile.utilization_percentage || 0)}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{profile.utilization_percentage || 0}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === 'profile' && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-[#c85f31]" />
                        Availability & Preferences
                    </h3>
                    <form onSubmit={handleSaveProfile} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Weekly Hours</label>
                                <input
                                    type="number"
                                    value={profileForm.max_weekly_hours}
                                    onChange={e => setProfileForm({ ...profileForm, max_weekly_hours: parseInt(e.target.value) })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#c85f31] focus:ring-1 focus:ring-[#c85f31]/30"
                                    min="1" max="168"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Preference</label>
                                <select
                                    value={profileForm.remote_preference}
                                    onChange={e => setProfileForm({ ...profileForm, remote_preference: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#c85f31] focus:ring-1 focus:ring-[#c85f31]/30"
                                >
                                    <option value="remote">Remote</option>
                                    <option value="onsite">Onsite</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Available From</label>
                                <input
                                    type="date"
                                    value={profileForm.availability_start}
                                    onChange={e => setProfileForm({ ...profileForm, availability_start: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#c85f31] focus:ring-1 focus:ring-[#c85f31]/30"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Available Until</label>
                                <input
                                    type="date"
                                    value={profileForm.availability_end}
                                    onChange={e => setProfileForm({ ...profileForm, availability_end: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#c85f31] focus:ring-1 focus:ring-[#c85f31]/30"
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-[#c85f31] hover:bg-[#b5522a] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'skills' && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Wrench size={18} className="text-[#c85f31]" />
                        My Skills
                    </h3>

                    {/* Current skills display */}
                    {profile.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-gray-100">
                            {profile.skills.map(s => (
                                <SkillBadge key={s.id} name={s.name} level={s.pivot?.proficiency_level} />
                            ))}
                        </div>
                    )}

                    {/* Editable skill rows */}
                    <div className="space-y-3">
                        {skills.length > 0 && (
                            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 text-xs text-gray-500 font-medium px-1">
                                <span>Skill</span>
                                <span>Proficiency</span>
                                <span>Years</span>
                                <span></span>
                            </div>
                        )}
                        {skills.map((s, idx) => {
                            const usedIds = skills.map(sk => sk.skill_id);
                            return (
                                <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
                                    <select
                                        value={s.skill_id}
                                        onChange={e => updateSkillRow(idx, 'skill_id', e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#c85f31]"
                                    >
                                        {allSkills.filter(sk => sk.id === s.skill_id || !usedIds.includes(sk.id)).map(sk => (
                                            <option key={sk.id} value={sk.id}>{sk.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={s.proficiency_level}
                                        onChange={e => updateSkillRow(idx, 'proficiency_level', e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#c85f31]"
                                    >
                                        {PROFICIENCY_LEVELS.map(l => (
                                            <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        value={s.years_of_experience}
                                        onChange={e => updateSkillRow(idx, 'years_of_experience', e.target.value)}
                                        className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#c85f31]"
                                        min="0" step="0.5"
                                    />
                                    <button onClick={() => removeSkillRow(idx)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            );
                        })}

                        {allSkills.filter(sk => !skills.map(s => s.skill_id).includes(sk.id)).length > 0 && (
                            <button
                                onClick={addSkillRow}
                                className="flex items-center gap-2 text-sm text-[#c85f31] hover:text-[#b5522a] font-medium transition-colors mt-2"
                            >
                                <Plus size={16} />
                                Add skill
                            </button>
                        )}

                        {allSkills.length === 0 && (
                            <p className="text-sm text-gray-400 italic">No skills have been defined by your admin yet.</p>
                        )}
                    </div>

                    <div className="pt-5 mt-5 border-t border-gray-100">
                        <button
                            onClick={handleSaveSkills}
                            disabled={savingSkills}
                            className="bg-[#c85f31] hover:bg-[#b5522a] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {savingSkills ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {savingSkills ? 'Saving...' : 'Save Skills'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'allocations' && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Briefcase size={18} className="text-[#c85f31]" />
                        My Project Allocations
                    </h3>

                    {(!profile.allocations || profile.allocations.length === 0) ? (
                        <div className="text-center py-8">
                            <Briefcase size={32} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm text-gray-400">No project allocations yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {profile.allocations.map(alloc => (
                                <div key={alloc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <h4 className="font-medium text-gray-900">{alloc.project?.name || 'Unknown Project'}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {alloc.allocated_hours}h/week • {alloc.role || 'Team Member'}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        alloc.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                                        alloc.status === 'proposed' ? 'bg-amber-50 text-amber-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {alloc.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
