import React, { useState } from 'react';
import api from '../api/client';
import { Rocket, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function OptimizePage() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState({});

    const runOptimization = async () => {
        setLoading(true);
        try {
            const res = await api.post('/optimize', {});
            setResults(res.data);
        } catch (err) {
            alert('Optimization failed: ' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    const acceptAll = async () => {
        if (!results?.proposals?.length) return;
        if (!confirm(`Accept all ${results.proposals.length} proposed allocations?`)) return;
        try {
            await api.post('/optimize/accept', { proposals: results.proposals });
            alert('All allocations created successfully!');
            setResults(null);
        } catch (err) {
            alert('Error accepting proposals: ' + (err.response?.data?.message || err.message));
        }
    };

    const toggleExpand = (idx) => {
        setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Optimizer</h2>

            {/* Run Button */}
            <div
                className="bg-[#f3f5f1] rounded-2xl p-6 mb-6 text-center"
                style={{ boxShadow: '8px 8px 16px #d1d3cf, -8px -8px 16px #ffffff' }}
            >
                <p className="text-[#3B593B] mb-4">
                    Run the optimization engine to generate allocation proposals based on skill matching, availability, and workload balance.
                </p>
                <button
                    onClick={runOptimization}
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-[#c85f31] hover:bg-[#b5522a] text-white px-8 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Rocket size={18} />
                    {loading ? 'Optimizing...' : ' Optimize Allocation'}
                </button>
            </div>

            {/* Results */}
            {results && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6 ">
                        {Object.entries(results.summary || {}).map(([key, value]) => (
                            <div
                                key={key}
                                className="bg-[#f3f5f1] rounded-2xl p-5 border border-[#c85f31]/10"
                                style={{ boxShadow: '6px 6px 12px #d1d3cf, -6px -6px 12px #ffffff, 0 0 20px 8px rgba(248, 187, 159, 0.25)' }}
                            >
                                <div className="text-xs text-[#405747] mb-1">{key.replace(/_/g, ' ').toUpperCase()}</div>
                                <div className="text-xl font-bold text-gray-900">{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Proposals List */}
                    <div
                        className="bg-[#f3f5f1] rounded-2xl overflow-hidden mb-6"
                        style={{ boxShadow: '8px 8px 16px #d1d3cf, -8px -8px 16px #ffffff' }}
                    >
                        <div className="px-5 py-4 border-b border-[#c85f31]/30 flex items-center justify-between" style={{ boxShadow: '0 4px 20px rgba(200, 95, 49, 0.15)' }}>
                            <h3 className="font-semibold text-gray-900">Proposed Allocations ({results.proposals?.length || 0})</h3>
                            <button onClick={acceptAll} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                <Check size={14} /> Accept All
                            </button>
                        </div>
                        <div className="divide-y divide-gray-300/50">
                            {(results.proposals || []).map((p, idx) => (
                                <div key={idx} className="px-5 py-3 hover:bg-gray-300/20 transition-colors">
                                    <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(idx)}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                                {(p.employee_name || '?')[0]}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-900">{p.employee_name}</span>
                                                <span className="text-gray-400 mx-2">→</span>
                                                <span className="text-[#405747]">{p.project_name}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-gray-500">{p.allocated_hours}h</span>
                                            <span className="text-sm font-medium text-[#c85f31]">Score: {p.allocation_score}</span>
                                            {expanded[idx] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                        </div>
                                    </div>
                                    {expanded[idx] && (
                                        <div className="mt-3 ml-12 p-3 bg-gray-200/50 rounded-lg text-xs text-[#405747] space-y-1">
                                            {(p.assignment_reason || '').split(' | ').map((reason, i) => (
                                                <div key={i}>• {reason}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}