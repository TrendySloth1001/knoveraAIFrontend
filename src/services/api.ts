export interface Message {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt?: string;
    embedding?: number[] | string;
    retrievedDocs?: any[];
}

export interface Conversation {
    id: string;
    title: string | null;
    lastActiveAt: string;
    messages: Message[];
}

export interface GenerateResponse {
    success: boolean;
    data: {
        response: string;
        conversationId: string;
        formatted?: any;
        embedding?: number[];
    };
}

export interface ConversationsResponse {
    success: boolean;
    data: Conversation[];
}

const BASE_URL = '/api/ai';

// Helper to get auth headers
const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const api = {
    getConversations: async (userId: string): Promise<Conversation[]> => {
        try {
            if (!userId) {
                console.warn('No userId provided to getConversations');
                return [];
            }
            const parentUrl = `/api/ai/conversations`;
            const params = new URLSearchParams({
                userId,
                sessionType: 'chat',
                limit: '50'
            });
            const response = await fetch(`${parentUrl}?${params.toString()}`, {
                headers: getAuthHeaders(),
            });
            const data: ConversationsResponse = await response.json();
            return data.success ? data.data : [];
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
            return [];
        }
    },

    async getHealth(): Promise<{ status: string; provider: string; model: string } | null> {
        try {
            const response = await fetch(`${BASE_URL}/health`, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('Failed to fetch health status:', error);
            return null;
        }
    },

    async getConversationStats(conversationId: string): Promise<{ messageCount: number; totalTokens: number; duration: number } | null> {
        try {
            const response = await fetch(`${BASE_URL}/conversations/${conversationId}/stats`, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('Failed to fetch conversation stats:', error);
            return null;
        }
    },

    async getConversationMessages(conversationId: string): Promise<Message[]> {
        try {
            const response = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) {
            console.error('Failed to fetch conversation messages:', error);
            return [];
        }
    },

    async deleteConversation(conversationId: string, teacherId: string): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await fetch(`${BASE_URL}/conversations/${conversationId}?teacherId=${teacherId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            return { success: false, message: 'Failed to delete conversation' };
        }
    },

    sendMessage: async (
        prompt: string,
        onChunk: (chunk: string) => void,
        conversationId?: string | null,
        teacherId?: string,
        webSearch: boolean = false,
        studentId?: string
    ): Promise<GenerateResponse['data'] | null> => {
        try {
            const userId = teacherId || studentId;
            if (!userId) {
                console.error('No userId provided to sendMessage');
                return null;
            }

            const requestBody: any = {
                prompt,
                conversationId,
                userId,
                temperature: 0.7,
                maxTokens: 300,
                stream: true,
                useRAG: true,
                webSearch: webSearch,
            };

            // Include role-specific IDs for backend compatibility
            if (teacherId) requestBody.teacherId = teacherId;
            if (studentId) requestBody.studentId = studentId;

            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(requestBody)
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';
            let finalData: any = null;
            let buffer = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    
                    // Keep the last incomplete line in the buffer
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.trim().startsWith('data: ')) {
                            try {
                                const jsonStr = line.replace('data: ', '').trim();
                                if (!jsonStr || jsonStr === '[DONE]') continue;

                                const data = JSON.parse(jsonStr);

                                if (data.type === 'start') {
                                    // Initial metadata, can be used if needed
                                    console.log('Stream started', data);
                                } else if (data.type === 'chunk' && data.content) {
                                    // Stream the content chunk by chunk
                                    onChunk(data.content);
                                    fullResponse += data.content;
                                } else if (data.type === 'done') {
                                    // Final metadata with conversationId and other info
                                    finalData = data;
                                } else if (data.type === 'error') {
                                    console.error('Stream error:', data.message);
                                    throw new Error(data.message);
                                }
                            } catch (e) {
                                console.warn('Failed to parse SSE line:', line, e);
                            }
                        }
                    }
                }
            }

            // Get the conversation ID from final data or use existing
            let resolvedConversationId = finalData?.conversationId || conversationId;

            if (!resolvedConversationId && userId) {
                // Fallback: fetch the latest conversation
                try {
                    const conversations = await api.getConversations(userId);
                    if (conversations && conversations.length > 0) {
                        const latest = conversations.sort((a, b) =>
                            new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
                        )[0];
                        resolvedConversationId = latest.id;
                    }
                } catch (e) {
                    console.error("Failed to recover conversation ID", e);
                }
            }

            return {
                response: fullResponse,
                conversationId: resolvedConversationId || '',
                embedding: finalData?.embedding || [],
                formatted: finalData?.formatted,
            };

        } catch (error) {
            console.error('Failed to send message:', error);
            return null;
        }
    }
};
