'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';
import { AlertProvider } from '../context/AlertContext';
import { Alert } from './Alert';
import { ConfirmModal } from './ConfirmModal';
import '../App.css';
import { ChatInterface } from './ChatInterface';

export function ClientWrapper() {
    const router = useRouter();
    const params = useParams();
    // params.conversationId will be undefined at /, and a string at /chat/:id

    // We can interpret the ID directly from params so we don't need local state for it really,
    // but ChatInterface expects `conversationId` string | null.
    // If params.conversationId is array (unlikely with this setup) or string.
    const rawId = params?.conversationId;
    const conversationId = typeof rawId === 'string' ? rawId : null;

    const [selectedTeacherId] = useState<string>('teacher-ai-123')
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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
                    <Sidebar
                        teacherId={selectedTeacherId}
                        onSelectConversation={handleSelectConversation}
                        currentConversationId={conversationId}
                        refreshTrigger={refreshTrigger}
                    />
                </div>

                {isSidebarOpen && (
                    <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
                )}

                <main className="main-content">
                    <ChatInterface
                        conversationId={conversationId}
                        teacherId={selectedTeacherId}
                        onConversationCreated={handleConversationCreated}
                    />
                </main>
                <Alert />
                <ConfirmModal />
            </div>
        </AlertProvider>
    )
}
