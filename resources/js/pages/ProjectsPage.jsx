import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { Plus, Clock, Users, X, Trash2 } from 'lucide-react';

const priorityColors = {
    critical: ' text-red-400 ',
    high: ' text-orange-400 ',
    medium: ' text-blue-400 ',
    low: 'text-gray-400',
};

const priorityBarColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-blue-500',
    low: 'bg-gray-500',
};

const proficiencyLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' },
];

const proficiencyColors = {
    beginner: 'text-gray-400',
    intermediate: 'text-blue-400',
    advanced: 'text-purple-400',
    expert: 'text-amber-400',
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [form, setForm] = useState({
        name: '', description: '', status: 'planning',
        priority: 'medium', estimated_hours: 0,
        start_date: '', deadline: '',
    });
    const [skillRequirements, setSkillRequirements] = useState([]);
    const [saving, setSaving] = useState(false);
    const [focusedSkillIdx, setFocusedSkillIdx] = useState(null);

    const fetchProjects = () => {
        api.get('/projects')
            .then(res => setProjects(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const fetchSkills = () => {
        api.get('/skills')
            .then(res => setAvailableSkills(res.data))
            .catch(console.error);
    };

    useEffect(() => {
        fetchProjects();
        fetchSkills();
    }, []);

    const openModal = () => {
        setForm({
            name: '', description: '', status: 'planning',
            priority: 'medium', estimated_hours: 0,
            start_date: '', deadline: '',
        });
        setSkillRequirements([]);
        setShowModal(true);
    };

    const addSkillRequirement = () => {
        setSkillRequirements([
            ...skillRequirements,
            { skill_id: null, skill_name: '', new_category: '', required_proficiency: 'intermediate', required_hours: 0 },
        ]);
        // Focus the new row's input after render
        setTimeout(() => setFocusedSkillIdx(skillRequirements.length), 50);
    };

    const selectExistingSkill = (index, skill) => {
        setSkillRequirements(prev => prev.map((r, i) =>
            i === index ? { ...r, skill_id: skill.id, skill_name: skill.name, new_category: '' } : r
        ));
        setFocusedSkillIdx(null);
    };

    const getFilteredSkills = (query) => {
        const usedIds = skillRequirements.filter(r => r.skill_id).map(r => r.skill_id);
        return availableSkills.filter(s =>
            !usedIds.includes(s.id) &&
            s.name.toLowerCase().includes(query.toLowerCase())
        );
    };

    const isNewSkill = (req) => {
        return req.skill_name.trim() !== '' && !req.skill_id;
    };

    const updateSkillRequirement = (index, field, value) => {
        setSkillRequirements(prev => prev.map((r, i) =>
            i === index ? { ...r, [field]: value } : r
        ));
    };

    const removeSkillRequirement = (index) => {
        setSkillRequirements(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // 1. Create any new skills first
            const resolvedRequirements = [];
            for (const req of skillRequirements) {
                if (req.skill_name.trim() === '') continue; // skip empty rows

                let skillId = req.skill_id;
                if (!skillId) {
                    // Create the new skill
                    const skillRes = await api.post('/skills', {
                        name: req.skill_name.trim(),
                        category: req.new_category.trim() || 'General',
                    });
                    skillId = skillRes.data.id;
                    // Update available skills so it's available immediately
                    setAvailableSkills(prev => [...prev, skillRes.data]);
                }
                resolvedRequirements.push({
                    skill_id: skillId,
                    required_proficiency: req.required_proficiency,
                    required_hours: req.required_hours,
                });
            }

            // 2. Create the project
            const payload = { ...form, estimated_hours: form.estimated_hours === '' ? 0 : form.estimated_hours };
            const res = await api.post('/projects', payload);
            const project = res.data;

            // 3. Attach skill requirements if any were specified
            if (resolvedRequirements.length > 0) {
                await api.post(`/projects/${project.id}/requirements`, {
                    requirements: resolvedRequirements,
                });
            }

            setShowModal(false);
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving project');
        }
        setSaving(false);
    };



    if (loading) return <div className="text-gray-400">Loading projects...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Projects</h2>
                <button onClick={openModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Plus size={16} /> Add Project
                </button>
            </div>

            {/* Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(p => {
                    const daysLeft = p.deadline ? Math.ceil((new Date(p.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                    return (
                        <div
                            key={p.id}
                            className="bg-[#f3f5f1] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                            style={{
                                boxShadow: '8px 8px 16px #d1d3cf, -8px -8px 16px #ffffff',
                            }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = 'inset 4px 4px 8px #d1d3cf, inset -4px -4px 8px #ffffff'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '8px 8px 16px #d1d3cf, -8px -8px 16px #ffffff'}
                        >
                            {/* Priority Color Bar */}
                            <div className={`h-7 ${priorityBarColors[p.priority] || 'bg-gray-500'}`} />
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-base">{p.name}</h3>
                                    <span className={`px-2 py-0.5  text-xs font-medium  ${priorityColors[p.priority]}`}>
                                        {p.priority.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{p.description}</p>

                                {/* Deadline */}
                                {daysLeft !== null && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                                        <Clock size={12} />
                                        {daysLeft > 0 ? `${daysLeft} days remaining` : (
                                            <span className="text-red-400">⚠️ {Math.abs(daysLeft)} days overdue</span>
                                        )}
                                    </div>
                                )}

                                {/* Staffing Progress */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>Staffing</span>
                                        <span>{p.staffing_coverage}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${p.staffing_coverage >= 100 ? 'bg-green-500' :
                                                p.staffing_coverage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${Math.min(100, p.staffing_coverage)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Skill Tags */}
                                <div className="flex flex-wrap gap-1">
                                    {(p.skill_requirements || []).map(s => (
                                        <span key={s.id} className="px-1 py-0.5  text-gray-500">
                                            {s.name}
                                        </span>
                                    ))}
                                </div>

                                {/* Stats row */}
                                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-800 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><Clock size={11} /> {p.estimated_hours}h</span>
                                    <span className="flex items-center gap-1"><Users size={11} /> {(p.allocations || []).length} assigned</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Project Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-[#243630] border border-gray-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg text-white font-bold">Add Project</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm text-white mb-1">Name</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm text-white mb-1">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" rows="3" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-white mb-1">Priority</label>
                                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                                        <option value="low" className="text-black">Low</option>
                                        <option value="medium" className="text-black">Medium</option>
                                        <option value="high" className="text-black">High</option>
                                        <option value="critical" className="text-black">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-white mb-1">Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                                        <option value="planning" className="text-black">Planning</option>
                                        <option value="active" className="text-black">Active</option>
                                        <option value="on_hold" className="text-black">On Hold</option>
                                        <option value="completed" className="text-black">Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-white mb-1">Estimated Hours</label>
                                <input type="number" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" min="0" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-white mb-1">Start Date</label>
                                    <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm text-white mb-1">Deadline</label>
                                    <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>

                            {/* ── Skill Requirements Section ─────────────────── */}
                            <div className="border-t border-gray-700 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-white">Skill Requirements</label>
                                    <button
                                        type="button"
                                        onClick={addSkillRequirement}
                                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        <Plus size={14} /> Add Skill
                                    </button>
                                </div>

                                {skillRequirements.length === 0 && (
                                    <p className="text-xs text-gray-500 italic mb-2">
                                        No skill requirements added. The optimizer needs these to match employees effectively.
                                    </p>
                                )}

                                <div className="space-y-2">
                                    {skillRequirements.map((req, idx) => {
                                        const filtered = getFilteredSkills(req.skill_name);
                                        const showDropdown = focusedSkillIdx === idx && req.skill_name.trim() !== '' && !req.skill_id;
                                        const nameIsNew = isNewSkill(req);
                                        const exactMatch = availableSkills.some(s => s.name.toLowerCase() === req.skill_name.trim().toLowerCase());

                                        return (
                                            <div key={idx} className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-2.5 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    {/* Skill name input (combobox) */}
                                                    <div className="relative flex-1 min-w-0">
                                                        <input
                                                            type="text"
                                                            value={req.skill_name}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                // Clear skill_id if user is typing something new
                                                                updateSkillRequirement(idx, 'skill_name', val);
                                                                updateSkillRequirement(idx, 'skill_id', null);
                                                                setFocusedSkillIdx(idx);
                                                            }}
                                                            onFocus={() => setFocusedSkillIdx(idx)}
                                                            onBlur={() => setTimeout(() => {
                                                                if (focusedSkillIdx === idx) setFocusedSkillIdx(null);
                                                            }, 200)}
                                                            placeholder="Type skill name..."
                                                            className={`w-full bg-gray-800 border rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 ${req.skill_id ? 'border-green-600/50' : nameIsNew && !exactMatch ? 'border-amber-600/50' : 'border-gray-700'
                                                                }`}
                                                            autoFocus={focusedSkillIdx === idx}
                                                        />
                                                        {req.skill_id && (
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-[10px]">✓</span>
                                                        )}

                                                        {/* Suggestions dropdown */}
                                                        {showDropdown && filtered.length > 0 && (
                                                            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-32 overflow-y-auto">
                                                                {filtered.slice(0, 8).map(s => (
                                                                    <button
                                                                        key={s.id}
                                                                        type="button"
                                                                        onMouseDown={(e) => {
                                                                            e.preventDefault();
                                                                            selectExistingSkill(idx, s);
                                                                        }}
                                                                        className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-between"
                                                                    >
                                                                        <span>{s.name}</span>
                                                                        <span className="text-[10px] text-gray-500">{s.category}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Proficiency selector */}
                                                    <select
                                                        value={req.required_proficiency}
                                                        onChange={e => updateSkillRequirement(idx, 'required_proficiency', e.target.value)}
                                                        className={`bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500 ${proficiencyColors[req.required_proficiency]}`}
                                                    >
                                                        {proficiencyLevels.map(l => (
                                                            <option key={l.value} value={l.value}>{l.label}</option>
                                                        ))}
                                                    </select>

                                                    {/* Required hours */}
                                                    <input
                                                        type="number"
                                                        value={req.required_hours}
                                                        onChange={e => updateSkillRequirement(idx, 'required_hours', parseInt(e.target.value) || 0)}
                                                        className="w-16 bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 text-center"
                                                        min="0"
                                                        placeholder="hrs"
                                                        title="Required hours for this skill"
                                                    />

                                                    {/* Remove button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSkillRequirement(idx)}
                                                        className="text-gray-500 hover:text-red-400 transition-colors p-0.5"
                                                        title="Remove requirement"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                {/* New skill indicator + category input */}
                                                {nameIsNew && !exactMatch && (
                                                    <div className="flex items-center gap-2 ml-0.5">
                                                        <span className="text-[10px] text-amber-400 whitespace-nowrap"> New skill —</span>
                                                        <input
                                                            type="text"
                                                            value={req.new_category}
                                                            onChange={e => updateSkillRequirement(idx, 'new_category', e.target.value)}
                                                            placeholder="Category (e.g. Frontend, DevOps)"
                                                            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500/50"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <button type="submit" disabled={saving} className="w-full bg-[#c85f31] hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                                {saving ? 'Creating...' : 'Create Project'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}