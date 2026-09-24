import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Plus, X } from 'lucide-react';

const statusColors = {
    proposed: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    confirmed: 'border-green-500/30 bg-green-500/10 text-green-400',
    completed: 'border-gray-500/30 bg-gray-500/10 text-gray-400',
};

export default function AllocationsPage() {
    const [allocations, setAllocations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        employee_id: '', project_id: '', allocated_hours: 10,
        start_date: '', end_date: '', status: 'proposed',
    });

    const fetchData = async () => {
        try {
            const [allRes, empRes, projRes] = await Promise.all([
                api.get('/allocations'),
                api.get('/employees'),
                api.get('/projects'),
            ]);
            setAllocations(allRes.data);
            setEmployees(empRes.data);
            setProjects(projRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/allocations', form);
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating allocation');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.put(`/allocations/${id}`, { status: newStatus });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this allocation?')) return;
        try {
            await api.delete(`/allocations/${id}`);
            fetchData();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="text-gray-400">Loading allocations...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Allocations</h2>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Plus size={16} /> Manual Assign
                </button>
            </div>
            <div
                className="bg-[#f3f5f1] rounded-2xl overflow-hidden"
                style={{ boxShadow: '8px 8px 16px #d1d3cf, -8px -8px 16px #ffffff' }}
            >
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-white border-b border-gray-800 bg-[#c85f31]">
                            <th className="text-left py-3 px-4">Employee</th>
                            <th className="text-left py-3 px-4">Project</th>
                            <th className="text-left py-3 px-4">Hours</th>
                            <th className="text-left py-3 px-4">Dates</th>
                            <th className="text-left py-3 px-4">Status</th>
                            <th className="text-left py-3 px-4">Score</th>
                            <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allocations.map(a => (
                            <tr key={a.id} className="border-b border-gray-300/50 hover:bg-gray-300/30">
                                <td className="py-3 px-4 font-medium">{a.employee?.name}</td>
                                <td className="py-3 px-4 text-black">{a.project?.name}</td>
                                <td className="py-3 px-4">{a.allocated_hours}h</td>
                                <td className="py-3 px-4 text-xs text-gray-500">
                                    {a.start_date?.slice(0, 10)} → {a.end_date?.slice(0, 10)}
                                </td>
                                <td className="py-3 px-4">
                                    <select
                                        value={a.status}
                                        onChange={e => handleStatusChange(a.id, e.target.value)}
                                        className={`px-2 py-1 rounded-full text-xs font-medium border bg-transparent cursor-pointer ${statusColors[a.status]}`}
                                    >
                                        <option value="proposed">Proposed</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </td>
                                <td className="py-3 px-4 text-gray-400">{a.allocation_score ?? '—'}</td>
                                <td className="py-3 px-4">
                                    <button onClick={() => handleDelete(a.id)} className="text-gray-400 hover:text-red-400 text-xs">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {allocations.length === 0 && (
                            <tr><td colSpan="7" className="py-8 text-center text-gray-500">No allocations yet. Use the Optimizer or manually assign employees.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Manual Assignment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-[#243630] border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg text-white font-bold">Manual Assignment</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm text-white mb-1">Employee</label>
                                <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} className="w-full bg-white/10 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" required>
                                    <option className="text-black" value="">Select employee...</option>
                                    {employees.map(e => <option className="text-black" key={e.id} value={e.id}>{e.name} ({e.remaining_capacity}h available)</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-white mb-1">Project</label>
                                <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="w-full bg-white/10 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" required>
                                    <option className="text-black" value="">Select project...</option>
                                    {projects.map(p => <option className="text-black" key={p.id} value={p.id}>{p.name} ({p.staffing_coverage}% staffed)</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-white mb-1">Hours</label>
                                <input type="number" value={form.allocated_hours} onChange={e => setForm({ ...form, allocated_hours: parseInt(e.target.value) || 0 })} className="w-full bg-white/10 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" min="1" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-white mb-1">Start Date</label>
                                    <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full bg-white/10 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-white mb-1">End Date</label>
                                    <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full bg-white/10 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" required />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-[#c85f31] hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                                Create Allocation
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}