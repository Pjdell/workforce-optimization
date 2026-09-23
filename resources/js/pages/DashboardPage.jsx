import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Users, FolderKanban, Activity, AlertTriangle } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';

function OverviewCard({ icon: Icon, title, value, subtitle, color }) {
    return (
        <div
            className="bg-[#f3f5f1] rounded-2xl p-5 transition-all duration-300 cursor-default"
            style={{ boxShadow: '6px 6px 12px #d1d3cf, -6px -6px 12px #ffffff' }}
        >
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon size={26} />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm text-gray-500">{title}</span>
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
}

function getUtilColor(pct) {
    if (pct > 100) return '#ef4444';
    if (pct > 90) return '#f59e0b';
    if (pct > 70) return '#eab308';
    return '#22c55e';
}

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/overview')
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="text-gray-500">Loading dashboard...</div>;
    }

    if (!data) {
        return <div className="text-red-400">Failed to load dashboard data.</div>;
    }

    const utilizationData = (data.employees || []).map(e => ({
        name: e.name.split(' ')[0],
        utilization: e.utilization_percentage,
    }));

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Dashboard</h2>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <OverviewCard
                    icon={Users}
                    title="Total Employees"
                    value={data.total_employees}
                    color=" text-blue-400"
                />
                <OverviewCard
                    icon={FolderKanban}
                    title="Active Projects"
                    value={data.active_projects}
                    color=" text-purple-400"
                />
                <OverviewCard
                    icon={Activity}
                    title="Avg Utilization"
                    value={`${data.avg_utilization}%`}
                    color=" text-green-400"
                />
                <OverviewCard
                    icon={AlertTriangle}
                    title="Overallocated"
                    value={data.overallocated}
                    subtitle={`${data.underutilized} underutilized`}
                    color=" text-red-400"
                />
            </div>

            {/* Utilization Chart */}
            <div
                className="bg-[#f3f5f1] rounded-2xl p-5"
                style={{ boxShadow: '8px 8px 16px #d1d3cf, -8px -8px 16px #ffffff' }}
            >
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Employee Utilization</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={utilizationData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" domain={[0, 120]} stroke="#6b7280" />
                        <YAxis type="category" dataKey="name" stroke="#6b7280" width={80} />
                        <Tooltip
                            contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#1f2937' }}
                            labelStyle={{ color: '#1f2937' }}
                        />
                        <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
                            {utilizationData.map((entry, index) => (
                                <Cell key={index} fill={getUtilColor(entry.utilization)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Project Table */}
            <div
                className="bg-[#f3f5f1] rounded-2xl p-5 mt-6"
                style={{ boxShadow: '8px 8px 16px #d1d3cf, -8px -8px 16px #ffffff' }}
            >
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Project Status</h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-gray-500 border-b border-gray-200">
                            <th className="text-left py-3 px-2">Project</th>
                            <th className="text-left py-3 px-2">Priority</th>
                            <th className="text-left py-3 px-2">Status</th>
                            <th className="text-left py-3 px-2">Staffing</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data.projects || []).map(p => (
                            <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-2 font-medium text-gray-900">{p.name}</td>
                                <td className="py-3 px-2">
                                    <span className={`px-2 py-1 rounded-full text-s font-medium ${p.priority === 'critical' ? 'text-red-600' :
                                        p.priority === 'high' ? ' text-orange-600' :
                                            p.priority === 'medium' ? ' text-blue-600' :
                                                ' text-gray-600'
                                        }`}>
                                        {p.priority}
                                    </span>
                                </td>
                                <td className="py-3 px-2">
                                    <span className="px-2 py-1 rounded-full text-s  text-green-600">
                                        {p.status}
                                    </span>
                                </td>
                                <td className="py-3 px-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-blue-500"
                                                style={{ width: `${Math.min(100, p.staffing_coverage)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500">{p.staffing_coverage}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}