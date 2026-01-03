import { useEffect, useState } from 'react';
import { api, Conversation } from '../services/api';
import { MessageSquare, Plus } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    teacherId: string;
    onSelectConversation: (id: string | null) => void;
    currentConversationId: string | null;
    refreshTrigger?: number;
}

export function Sidebar({ teacherId, onSelectConversation, currentConversationId, refreshTrigger }: SidebarProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);

    const [health, setHealth] = useState<{ status: string; provider: string } | null>(null);

    useEffect(() => {
        loadConversations();
        checkHealth();
    }, [teacherId, refreshTrigger]);

    const loadConversations = async () => {
        const data = await api.getConversations(teacherId);
        setConversations(data);
    };

    const checkHealth = async () => {
        const data = await api.getHealth();
        if (data) {
            setHealth({ status: data.status, provider: data.provider });
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <button
                    className="new-chat-btn"
                    onClick={() => onSelectConversation(null)}
                >
                    <Plus size={16} />
                    New Chat
                </button>
            </div>

            <div className="conversations-list">
                {conversations.map((conv) => (
                    <button
                        key={conv.id}
                        className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
                        onClick={() => onSelectConversation(conv.id)}
                    >
                        <MessageSquare size={16} />
                        <span className="conversation-title">
                            {conv.title || 'New Conversation'}
                        </span>
                    </button>
                ))}
            </div>

            <div className="sidebar-footer">
                <div className="health-status">
                    <div className={`status-indicator ${health ? 'online' : 'offline'}`} />
                    <span>{health ? `System: ${health.status}` : 'System: Offline'}</span>
                </div>
            </div>
        </aside>
    );
}
