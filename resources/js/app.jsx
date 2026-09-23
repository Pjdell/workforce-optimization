import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import ProjectsPage from './pages/ProjectsPage';
import AllocationsPage from './pages/AllocationsPage';
import OptimizePage from './pages/OptimizePage';
import MyProfilePage from './pages/employee/MyProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AcceptInvitationPage from './pages/auth/AcceptInvitationPage';

function AuthRedirect({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return null;
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return children;
}

function AppRoutes() {
    const { isAdmin } = useAuth();

    return (
        <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
            <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
            <Route path="/forgot-password" element={<AuthRedirect><ForgotPasswordPage /></AuthRedirect>} />
            <Route path="/reset-password" element={<AuthRedirect><ResetPasswordPage /></AuthRedirect>} />
            <Route path="/invite/accept/:token" element={<AcceptInvitationPage />} />

            {/* Protected routes */}
            <Route path="/" element={
                <ProtectedRoute>
                    <AppLayout>
                        {isAdmin ? <DashboardPage /> : <MyProfilePage />}
                    </AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
                <ProtectedRoute role="admin">
                    <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/employees" element={
                <ProtectedRoute role="admin">
                    <AppLayout><EmployeesPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/projects" element={
                <ProtectedRoute role="admin">
                    <AppLayout><ProjectsPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/allocations" element={
                <ProtectedRoute role="admin">
                    <AppLayout><AllocationsPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/optimize" element={
                <ProtectedRoute role="admin">
                    <AppLayout><OptimizePage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/my-profile" element={
                <ProtectedRoute>
                    <AppLayout><MyProfilePage /></AppLayout>
                </ProtectedRoute>
            } />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

const container = document.getElementById('app');
if (container) {
    createRoot(container).render(<App />);
}
