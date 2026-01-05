import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Database, Globe } from 'lucide-react';
import { api, Message } from '../services/api';
import { VectorVisualizer } from './VectorVisualizer';
import './ChatInterface.css';

interface ChatInterfaceProps {
    conversationId: string | null;
    teacherId?: string;
    studentId?: string;
    onConversationCreated?: (id: string) => void;
}

export function ChatInterface({ conversationId, teacherId, studentId, onConversationCreated }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [expandedEmbeddings, setExpandedEmbeddings] = useState<Set<number>>(new Set());
    const [stats, setStats] = useState<{ messageCount: number; totalTokens: number; duration: number } | null>(null);
    const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Use userId (either teacherId or studentId)
    const userId = teacherId || studentId;

    useEffect(() => {
        if (conversationId) {
            loadMessages();
            loadStats();
        } else {
            setMessages([]);
            setStats(null);
        }
    }, [conversationId]);

    const loadMessages = async () => {
        if (!conversationId) return;
        const msgs = await api.getConversationMessages(conversationId);
        setMessages(msgs);
    };

    const loadStats = async () => {
        if (!conversationId) return;
        const data = await api.getConversationStats(conversationId);
        setStats(data);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const toggleEmbedding = (idx: number) => {
        const newSet = new Set(expandedEmbeddings);
        if (newSet.has(idx)) {
            newSet.delete(idx);
        } else {
            newSet.add(idx);
        }
        setExpandedEmbeddings(newSet);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input };

        // Add user message immediately
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Create placeholder for assistant message
        const assistantMsgId = Date.now().toString(); // temporary ID
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: '',
            id: assistantMsgId
        }]);

        let currentResponse = '';

        const handleChunk = (chunk: string) => {
            currentResponse += chunk;
            // Force immediate update for smooth streaming
            setMessages(prev => {
                const updated = prev.map(msg =>
                    msg.id === assistantMsgId ? { ...msg, content: currentResponse } : msg
                );
                return updated;
            });
        };

        const response = await api.sendMessage(
            userMsg.content,
            handleChunk,
            conversationId,
            teacherId,
            isWebSearchEnabled,
            studentId
        );

        if (response) {
            // Update with final response (embedding might be available now)
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId ? {
                    ...msg,
                    content: response.response,
                    embedding: response.embedding
                } : msg
            ));

            // Handle new conversation creation
            if (response.conversationId && response.conversationId !== conversationId) {
                if (onConversationCreated) {
                    onConversationCreated(response.conversationId);
                }
            } else if (conversationId) {
                loadStats(); // Refresh stats for existing conversation
            }
        }

        setIsLoading(false);
    };

    return (
        <div className="chat-interface">

            <div className="messages-area">
                {messages.length === 0 ? (
                    <div className="empty-state">
                        <h1>Knovera AI</h1>
                        <p>How can I help you today?</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.role}`}>
                            <div className="message-content">
                                <div className="message-role">
                                    {msg.role === 'user' ? 'You' : 'AI'}
                                    {stats && msg.role === 'assistant' && (
                                        <span className="message-stats-inline">
                                            {stats.duration.toFixed(1)}s | {stats.totalTokens} tokens
                                        </span>
                                    )}
                                    {msg.embedding && (
                                        <button
                                            className="embedding-toggle"
                                            onClick={() => toggleEmbedding(idx)}
                                            title="View Embedding"
                                            type="button"
                                        >
                                            <Database size={14} />
                                            <span style={{ fontSize: '0.75rem' }}>Vector</span>
                                        </button>
                                    )}
                                </div>
                                <div className="markdown-body">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            a: ({ node, ...props }) => {
                                                const [hover, setHover] = useState(false);
                                                return (
                                                    <span
                                                        className="link-tooltip-container"
                                                        onMouseEnter={() => setHover(true)}
                                                        onMouseLeave={() => setHover(false)}
                                                    >
                                                        <a
                                                            {...props}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="citation-link"
                                                        >
                                                            [Link]
                                                        </a>
                                                        {hover && (
                                                            <div className="link-tooltip">
                                                                {props.href}
                                                            </div>
                                                        )}
                                                    </span>
                                                );
                                            },
                                            table: ({ node, ...props }) => (
                                                <div className="table-responsive">
                                                    <table {...props} />
                                                </div>
                                            )
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                                {expandedEmbeddings.has(idx) && msg.embedding && (
                                    (() => {
                                        let embeddingData: number[] | null = null;
                                        try {
                                            if (Array.isArray(msg.embedding)) {
                                                embeddingData = msg.embedding as number[];
                                            } else if (typeof msg.embedding === 'string') {
                                                embeddingData = JSON.parse(msg.embedding);
                                            }
                                        } catch (e) {
                                            console.error("Failed to parse embedding", e);
                                        }

                                        return Array.isArray(embeddingData) ? (
                                            <VectorVisualizer
                                                data={embeddingData}
                                                compareTo={
                                                    // Find nearest previous embedding
                                                    (() => {
                                                        for (let i = idx - 1; i >= 0; i--) {
                                                            let prevParams: any = messages[i].embedding;
                                                            // Parse previous if needed
                                                            if (typeof prevParams === 'string') {
                                                                try { prevParams = JSON.parse(prevParams); } catch (e) { }
                                                            }
                                                            if (Array.isArray(prevParams)) return prevParams as number[];
                                                        }
                                                        return undefined;
                                                    })()
                                                }
                                            />
                                        ) : (
                                            <div className="embedding-view">
                                                <pre>{typeof msg.embedding === 'string' ? msg.embedding : JSON.stringify(msg.embedding, null, 2)}</pre>
                                            </div>
                                        );
                                    })()
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
                <form onSubmit={handleSubmit} className="input-form">
                    <button
                        type="button"
                        className={`web-search-toggle ${isWebSearchEnabled ? 'active' : ''}`}
                        onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                        title={isWebSearchEnabled ? "Web Search On" : "Web Search Off"}
                    >
                        <Globe size={20} />
                    </button>
                    <div className="model-badge">
                        <span>qwen2.5:7b</span>
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message..."
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={!input.trim() || isLoading}>
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
