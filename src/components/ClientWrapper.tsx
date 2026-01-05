'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Menu, X, LogOut } from 'lucide-react';
import { AlertProvider } from '../context/AlertContext';
import { Alert } from './Alert';
import { ConfirmModal } from './ConfirmModal';
import '../App.css';
import { ChatInterface } from './ChatInterface';
import { authService } from '../services/auth';

interface ClientWrapperProps {
  children?: ReactNode;
}

export function ClientWrapper({ children }: ClientWrapperProps) {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const { user, profile, isAuthenticated, isLoading, logout, token } = useAuth();
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Use the logged-in user's ID for conversations
    const userId = user?.id || '';
    const userRole = user?.role || 'STUDENT';

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/auth/callback', '/signup/role', '/signup/teacher', '/signup/student'];
    const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

    // Handle authentication redirect
    useEffect(() => {
        // Don't redirect if still loading or on public route
        if (isLoading || isPublicRoute) {
            return;
        }

        // Redirect to login if not authenticated
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, isPublicRoute, router, pathname]);

    // Get conversation ID from params
    const rawId = params?.conversationId;
    const conversationId = typeof rawId === 'string' ? rawId : null;

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleSelectConversation = (id: string | null) => {
        if (id) {
            router.push(`/chat/${id}`);
        } else {
            router.push('/');
        }
        setIsSidebarOpen(false);
    };

    const handleConversationCreated = (newId: string) => {
        setRefreshTrigger(prev => prev + 1);
        router.push(`/chat/${newId}`);
    };

    const handleLogout = async () => {
        if (token) {
            await authService.logout(token);
        }
        logout();
        router.push('/login');
    };

    // Show loading state
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid rgba(255, 255, 255, 0.1)',
                    borderTopColor: '#667eea',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }}></div>
            </div>
        );
    }

    // Render public routes (login, callback) without wrapper
    if (isPublicRoute) {
        return <>{children}</>;
    }

    // Don't render protected content if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    return (
        <AlertProvider>
            <div className="app-container">
                <button
                    className="mobile-menu-btn"
                    onClick={toggleSidebar}
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        height: '100%' 
                    }}>
                        <Sidebar
                            teacherId={userRole === 'TEACHER' ? userId : ''}
                            onSelectConversation={handleSelectConversation}
                            currentConversationId={conversationId}
                            refreshTrigger={refreshTrigger}
                        />
                        <div style={{
                            padding: '1rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                        }}>
                            <div 
                                onClick={() => router.push('/profile')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    flex: 1,
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {user?.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt="Profile"
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '2px solid rgba(102, 126, 234, 0.5)',
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.125rem',
                                        fontWeight: 700,
                                        color: '#ffffff',
                                        textTransform: 'uppercase',
                                    }}>
                                        {profile?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <div style={{
                                    flex: 1,
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        color: '#ffffff',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {profile?.firstName} {profile?.lastName}
                                    </div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {user?.email}
                                    </div>
                                    <div style={{
                                        fontSize: '0.65rem',
                                        color: 'rgba(255, 255, 255, 0.4)',
                                        marginTop: '0.25rem',
                                    }}>
                                        {user?.role}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                style={{
                                    padding: '0.5rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '6px',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                }}
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {isSidebarOpen && (
                    <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
                )}

                <main className="main-content">
                    {pathname === '/profile' ? (
                        children
                    ) : (
                        <ChatInterface
                            conversationId={conversationId}
                            teacherId={userRole === 'TEACHER' ? userId : ''}
                            studentId={userRole === 'STUDENT' ? userId : ''}
                            onConversationCreated={handleConversationCreated}
                        />
                    )}
                </main>
                <Alert />
                <ConfirmModal />
            </div>
        </AlertProvider>
    );
}
