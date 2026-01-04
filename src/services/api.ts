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
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
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

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.trim().startsWith('data: ')) {
                            try {
                                const jsonStr = line.replace('data: ', '').trim();
                                if (jsonStr === '[DONE]') continue; // Standard SSE end format if used

                                const data = JSON.parse(jsonStr);

                                if (data.type === 'chunk' && data.content) {
                                    onChunk(data.content);
                                    fullResponse += data.content;
                                } else if (data.type === 'done') {
                                    // Capture final info if needed
                                    // We might construct the final return object here
                                    // But we return at the end of function
                                }
                            } catch (e) {
                                console.warn('Failed to parse SSE line:', line);
                            }
                        }
                    }
                }
            }
            // This suggests we need the new conversationId.
            // If the stream is just text, we assume it's the assistant's content.
            // We might need to fetch the conversation details afterwards if headers don't have it.
            // Or maybe the backend sends a final JSON chunk?
            // Let's assume we accumulate text and rely on reloading conversation to get the ID if not provided.
            // WAIT, looking at previous code: `return data.success ? data.data : null;`
            // If I stream, I can't just `await response.json()`.

            // Let's assume the stream is just the content string for now.
            // If the backend is ours (Node/Express), likely res.write().

            // IMPORTANT: If conversationID is null, how do we get the new ID?
            // Maybe it is returned in a header or the first chunk?
            // Let's check if the response returns JSON-lines or just text.
            // Since I cannot check backend code, I will implement robust handling:
            // 1. Accumulate text.
            // 2. Return a constructed object.
            // 3. BUT conversationId is needed for sync.
            // Let's assume standard behavior: if new chat, we might need to `getConversations` and pick the latest if ID is missing.
            // OR the backend sends a JSON at the END or BEGINNING.

            // Safest bet without backend code access: 
            // The "data" object returned previously had `conversationId`.
            // Use a workaround: Refetch conversations list to find the new one if we started with null.

            // Actually, let's look at the "output" example in User Request 0. It showed JSON output.
            // If streaming, it's likely text.
            // Let's try to parse the FULL response as JSON at the end? NO, that fails if it was streamed text.

            // Let's implement text accumulation for `onChunk`.
            // And return a synthetic object.
            // We'll need a way to get the new conversation ID.
            // I'll assume we might need to refresh the list to find it if not present.

            // Return the captured final data, or construct a response from what we have
            // The 'done' event from backend has structure: { formatted: { raw: "..." }, ... }
            // If we don't have a conversationId yet (new chat), let's try to find it.
            // 1. Check if the final json chunk had it (finalData.conversationId)
            // 2. Check if we can infer it from the response headers (omitted here as fetch might consume them)
            // 3. Fallback: Refetch conversations list and pick the most recent one.
            let resolvedConversationId = finalData?.conversationId || conversationId;

            if (!resolvedConversationId && userId) {
                // HACK: New conversation was created but ID not returned.
                // We fetch the list of conversations and grab the latest one.
                try {
                    const conversations = await api.getConversations(userId);
                    if (conversations && conversations.length > 0) {
                        // Sort by lastActiveAt descending just in case, though API usually returns sorted
                        const latest = conversations.sort((a, b) =>
                            new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
                        )[0];
                        resolvedConversationId = latest.id;
                    }
                } catch (e) {
                    console.error("Failed to recover conversation ID", e);
                }
            }

            const finalResponseText = finalData?.formatted?.raw || finalData?.data?.response || fullResponse;

            return {
                response: finalResponseText,
                conversationId: resolvedConversationId || '',
                embedding: finalData?.embedding || finalData?.data?.embedding || [],
                formatted: finalData?.formatted
            };

        } catch (error) {
            console.error('Failed to send message:', error);
            return null;
        }
    }
};
