import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Plus, Pencil, Trash2, X, Wrench, Mail, Loader2, CheckCircle2, Clock } from 'lucide-react';

function SkillBadge({ name, level }) {
    const colors = {
        beginner: 'bg-gray-200 text-gray-700',
        intermediate: 'bg-blue-100 text-blue-700',
        advanced: 'bg-purple-100 text-purple-700',
        expert: 'bg-amber-100 text-amber-700',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[level] || colors.beginner}`}>
            {name}
        </span>
    );
}

function UtilizationBar({ percentage }) {
    const color =
        percentage > 100 ? 'bg-red-500' :
            percentage > 90 ? 'bg-yellow-500' :
                percentage > 70 ? 'bg-yellow-400' : 'bg-green-500';
    return (
        <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(120, percentage)}%` }} />
            </div>
            <span className="text-xs text-gray-400">{percentage}%</span>
        </div>
    );
}

const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function EmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [allSkills, setAllSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSkillManager, setShowSkillManager] = useState(false);
    const [managingEmployee, setManagingEmployee] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [form, setForm] = useState({
        name: '', email: '', role: '', department: '',
        max_weekly_hours: 40, remote_preference: 'hybrid',
    });
    const [formSkills, setFormSkills] = useState([]);
    const [managedSkills, setManagedSkills] = useState([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [invitations, setInvitations] = useState([]);

    const fetchEmployees = () => {
        api.get('/employees')
            .then(res => setEmployees(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const fetchSkills = () => {
        api.get('/skills')
            .then(res => setAllSkills(res.data))
            .catch(console.error);
    };

    const fetchInvitations = () => {
        api.get('/invitations')
            .then(res => setInvitations(res.data))
            .catch(console.error);
    };

    useEffect(() => { fetchEmployees(); fetchSkills(); fetchInvitations(); }, []);

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviteError('');
        setInviteSuccess('');
        setInviting(true);
        try {
            const res = await api.post('/invitations', { email: inviteEmail });
            setInviteSuccess(res.data.message || 'Invitation sent!');
            setInviteEmail('');
            fetchInvitations();
        } catch (err) {
            setInviteError(err.response?.data?.message || 'Failed to send invitation.');
        } finally {
            setInviting(false);
        }
    };

    const openCreate = () => {
        setEditingEmployee(null);
        setForm({ name: '', email: '', role: '', department: '', max_weekly_hours: 40, remote_preference: 'hybrid' });
        setFormSkills([]);
        setShowModal(true);
    };

    const openEdit = (emp) => {
        setEditingEmployee(emp);
        setForm({
            name: emp.name, email: emp.email, role: emp.role,
            department: emp.department, max_weekly_hours: emp.max_weekly_hours,
            remote_preference: emp.remote_preference,
        });
        setFormSkills(
            (emp.skills || []).map(s => ({
                skill_id: s.id,
                proficiency_level: s.pivot?.proficiency_level || 'beginner',
                years_of_experience: s.pivot?.years_of_experience || 0,
            }))
        );
        setShowModal(true);
    };

    const openSkillManager = (emp) => {
        setManagingEmployee(emp);
        setManagedSkills(
            (emp.skills || []).map(s => ({
                skill_id: s.id,
                proficiency_level: s.pivot?.proficiency_level || 'beginner',
                years_of_experience: s.pivot?.years_of_experience || 0,
            }))
        );
        setShowSkillManager(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            let employee;
            if (editingEmployee) {
                const res = await api.put(`/employees/${editingEmployee.id}`, form);
                employee = res.data;
            } else {
                const res = await api.post('/employees', form);
                employee = res.data;
            }
            // Save skills if any were added
            if (formSkills.length > 0) {
                await api.post(`/employees/${employee.id}/skills`, { skills: formSkills });
            } else if (editingEmployee) {
                // Clear skills if all removed during edit
                await api.post(`/employees/${employee.id}/skills`, { skills: [] });
            }
            setShowModal(false);
            fetchEmployees();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error saving employee');
        }
    };

    const handleSaveSkills = async () => {
        if (!managingEmployee) return;
        try {
            await api.post(`/employees/${managingEmployee.id}/skills`, { skills: managedSkills });
            setShowSkillManager(false);
            fetchEmployees();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error saving skills');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        try {
            await api.delete(`/employees/${id}`);
            fetchEmployees();
        } catch (err) {
            console.error(err);
        }
    };

    // Helpers for skill rows in modal
    const addSkillRow = (setter, current) => {
        const usedIds = current.map(s => s.skill_id);
        const available = allSkills.filter(s => !usedIds.includes(s.id));
        if (available.length === 0) return;
        setter([...current, { skill_id: available[0].id, proficiency_level: 'beginner', years_of_experience: 0 }]);
    };

    const removeSkillRow = (setter, current, index) => {
        setter(current.filter((_, i) => i !== index));
    };

    const updateSkillRow = (setter, current, index, field, value) => {
        const updated = [...current];
        updated[index] = { ...updated[index], [field]: field === 'years_of_experience' ? parseFloat(value) || 0 : value };
        if (field === 'skill_id') updated[index].skill_id = parseInt(value);
        setter(updated);
    };

    const renderSkillRows = (skills, setter) => {
        const usedIds = skills.map(s => s.skill_id);
        return (
            <div className="space-y-2">
                {skills.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <select
                            value={s.skill_id}
                            onChange={e => updateSkillRow(setter, skills, idx, 'skill_id', e.target.value)}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white"
                        >
                            {allSkills.filter(sk => sk.id === s.skill_id || !usedIds.includes(sk.id)).map(sk => (
                                <option key={sk.id} value={sk.id}>{sk.name}</option>
                            ))}
                        </select>
                        <select
                            value={s.proficiency_level}
                            onChange={e => updateSkillRow(setter, skills, idx, 'proficiency_level', e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white"
                        >
                            {PROFICIENCY_LEVELS.map(l => (
                                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={s.years_of_experience}
                            onChange={e => updateSkillRow(setter, skills, idx, 'years_of_experience', e.target.value)}
                            className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white"
                            min="0" step="0.5" placeholder="Yrs"
                        />
                        <button type="button" onClick={() => removeSkillRow(setter, skills, idx)} className="text-gray-400 hover:text-red-400 p-1">
                            <X size={14} />
                        </button>
                    </div>
                ))}
                {allSkills.filter(sk => !usedIds.includes(sk.id)).length > 0 && (
                    <button
                        type="button"
                        onClick={() => addSkillRow(setter, skills)}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"
                    >
                        <Plus size={12} /> Add Skill
                    </button>
                )}
                {allSkills.length === 0 && (
                    <p className="text-xs text-gray-500">No skills defined yet. Create skills from the Skills page first.</p>
                )}
            </div>
        );
    };

    if (loading) return <div className="text-gray-400">Loading employees...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Employees</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setShowInviteModal(true); setInviteSuccess(''); setInviteError(''); }}
                        className="flex items-center gap-2 bg-[#243630] hover:bg-[#1a2b24] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Mail size={16} /> Invite Employee
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus size={16} /> Add Employee
                    </button>
                </div>
            </div>

            {/* Table */}
            <div
                className="bg-[#f3f5f1] rounded-2xl overflow-hidden"
                style={{ boxShadow: '8px 8px 16px #d1d3cf, -8px -8px 16px #ffffff' }}
            >
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-white border-b border-gray-400 bg-[#c85f31] ">
                            <th className="text-left py-3 px-4">Name</th>
                            <th className="text-left py-3 px-4">Department</th>
                            <th className="text-left py-3 px-4">Role</th>
                            <th className="text-left py-3 px-4">Skills</th>
                            <th className="text-left py-3 px-4">Utilization</th>
                            <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id} className="border-b border-gray-400/30 hover:bg-gray-400/30 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                                            {emp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-[#405747]">{emp.name}</div>
                                            <div className="text-xs text-[#6e826a]">{emp.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-[#405747]">{emp.department}</td>
                                <td className="py-3 px-4 text-[#405747]">{emp.role}</td>
                                <td className="py-3 px-4">
                                    <div className="flex flex-wrap gap-1">
                                        {(emp.skills || []).slice(0, 3).map(s => (
                                            <SkillBadge key={s.id} name={s.name} level={s.pivot?.proficiency_level} />
                                        ))}
                                        {(emp.skills || []).length > 3 && (
                                            <span className="text-xs text-gray-500">+{emp.skills.length - 3}</span>
                                        )}
                                        {(emp.skills || []).length === 0 && (
                                            <span className="text-xs text-gray-400 italic">No skills</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <UtilizationBar percentage={emp.utilization_percentage} />
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openSkillManager(emp)} className="p-1.5 rounded-lg hover:bg-blue-900/30 text-gray-400 hover:text-blue-400 transition-colors" title="Manage Skills">
                                            <Wrench size={14} />
                                        </button>
                                        <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Employee Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-[#243630] border border-gray-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-white">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            {['name', 'email', 'role', 'department'].map(field => (
                                <div key={field}>
                                    <label className="block text-sm text-white mb-1 capitalize">{field}</label>
                                    <input
                                        type={field === 'email' ? 'email' : 'text'}
                                        value={form[field]}
                                        onChange={e => setForm({ ...form, [field]: e.target.value })}
                                        className="w-full bg-white/10 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-sm text-white mb-1">Max Weekly Hours</label>
                                <input
                                    type="number"
                                    value={form.max_weekly_hours}
                                    onChange={e => setForm({ ...form, max_weekly_hours: parseInt(e.target.value) })}
                                    className="w-full bg-white/10 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    min="1" max="168"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white mb-1">Work Preference</label>
                                <select
                                    value={form.remote_preference}
                                    onChange={e => setForm({ ...form, remote_preference: e.target.value })}
                                    className="w-full bg-white/10 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="remote">Remote</option>
                                    <option value="onsite">Onsite</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>

                            {/* Skills Section */}
                            <div>
                                <label className="block text-sm text-white mb-2">Skills</label>
                                {renderSkillRows(formSkills, setFormSkills)}
                            </div>

                            <button type="submit" className="w-full bg-[#c85f31] hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                                {editingEmployee ? 'Update Employee' : 'Create Employee'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Dedicated Skill Manager Modal */}
            {showSkillManager && managingEmployee && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSkillManager(false)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-bold">Manage Skills</h3>
                                <p className="text-sm text-gray-400">{managingEmployee.name}</p>
                            </div>
                            <button onClick={() => setShowSkillManager(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                        </div>

                        <div className="mb-4">
                            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-xs text-gray-500 mb-2 px-1">
                                <span>Skill</span>
                                <span>Proficiency</span>
                                <span>Years</span>
                                <span></span>
                            </div>
                            {renderSkillRows(managedSkills, setManagedSkills)}
                        </div>

                        <button
                            onClick={handleSaveSkills}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                        >
                            Save Skills
                        </button>
                    </div>
                </div>
            )}

            {/* Invite Employee Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Invite Employee</h3>
                                <p className="text-sm text-gray-500">Send an email invitation to join your organization</p>
                            </div>
                            <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>

                        {inviteSuccess && (
                            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                                <CheckCircle2 size={16} /> {inviteSuccess}
                            </div>
                        )}
                        {inviteError && (
                            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                                {inviteError}
                            </div>
                        )}

                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#c85f31] focus:ring-1 focus:ring-[#c85f31]/30"
                                    placeholder="employee@company.com"
                                    required
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={inviting}
                                className="w-full bg-[#c85f31] hover:bg-[#b5522a] text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {inviting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                                {inviting ? 'Sending...' : 'Send Invitation'}
                            </button>
                        </form>

                        {/* Pending Invitations List */}
                        {invitations.length > 0 && (
                            <div className="mt-6 pt-5 border-t border-gray-100">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Pending Invitations</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {invitations.filter(i => i.status === 'pending').map(inv => (
                                        <div key={inv.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-amber-500" />
                                                <span className="text-sm text-gray-700">{inv.email}</span>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    await api.delete(`/invitations/${inv.id}`);
                                                    fetchInvitations();
                                                }}
                                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                Revoke
                                            </button>
                                        </div>
                                    ))}
                                    {invitations.filter(i => i.status === 'accepted').map(inv => (
                                        <div key={inv.id} className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                                <span className="text-sm text-gray-700">{inv.email}</span>
                                            </div>
                                            <span className="text-xs text-emerald-600">Accepted</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}