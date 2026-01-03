import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Menu, X } from 'lucide-react';
import { AlertProvider } from './context/AlertContext';
import { Alert } from './components/Alert';
import './App.css'
import { ChatInterface } from './components/ChatInterface'

function App() {
    const [selectedTeacherId] = useState<string>('teacher-ai-123') // Default for now
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleSelectConversation = (id: string | null) => {
        setCurrentConversationId(id);
        setIsSidebarOpen(false); // Close sidebar on selection (mobile)
    };

    const handleConversationCreated = (newId: string) => {
        setRefreshTrigger(prev => prev + 1);
        setCurrentConversationId(newId);
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
                        currentConversationId={currentConversationId}
                        refreshTrigger={refreshTrigger}
                    />
                </div>

                {isSidebarOpen && (
                    <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
                )}

                <main className="main-content">
                    <ChatInterface
                        conversationId={currentConversationId}
                        teacherId={selectedTeacherId}
                        onConversationCreated={handleConversationCreated}
                    />
                </main>
                <Alert />
            </div>
        </AlertProvider>
    )
}

export default App
