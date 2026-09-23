import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard, Users, FolderKanban, Link2,
    Rocket, Menu, ChevronLeft, LogOut, UserCircle, Building2
} from 'lucide-react';

const adminNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employees', label: 'Employees', icon: Users },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/allocations', label: 'Allocations', icon: Link2 },
    { path: '/optimize', label: 'Optimizer', icon: Rocket },
];

const employeeNavItems = [
    { path: '/my-profile', label: 'My Profile', icon: UserCircle },
];

export default function AppLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [loggingOut, setLoggingOut] = useState(false);

    const navItems = isAdmin ? adminNavItems : employeeNavItems;

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error(err);
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f5f1] text-gray-900 flex">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-[#243630] border-r border-gray-800 transition-all duration-300 z-40 flex flex-col ${sidebarOpen ? 'w-64' : 'w-16'
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
                    {sidebarOpen && (
                        <h1 className="text-lg font-bold text-white bg-clip-text text-transparent whitespace-nowrap">
                            Workforce Optimizer
                        </h1>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    >
                        {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 py-4 px-2 space-y-1">
                    {navItems.map(({ path, label, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? 'bg-[#c85f31] text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-[#9c4b31]'
                                }`
                            }
                        >
                            <Icon size={18} className="flex-shrink-0" />
                            {sidebarOpen && <span>{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User & Logout at bottom */}
                {sidebarOpen && user && (
                    <div className="p-3 border-t border-gray-800">
                        <div className="flex items-center gap-3 px-2 py-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c85f31] to-[#e07a4f] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {user.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-medium text-white truncate">{user.name}</div>
                                <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                                    <Building2 size={10} />
                                    {user.organization?.name || 'Organization'}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut size={16} />
                            {loggingOut ? 'Signing out...' : 'Sign out'}
                        </button>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
                {/* Top Bar */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 w-64"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        {user && (
                            <>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                    isAdmin
                                        ? 'bg-[#c85f31]/10 text-[#c85f31]'
                                        : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {isAdmin ? 'Admin' : 'Employee'}
                                </span>
                                <div className="w-8 h-8 rounded-full bg-[#c85f31] flex items-center justify-center text-xs font-bold text-white">
                                    {user.name?.charAt(0)?.toUpperCase()}
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}