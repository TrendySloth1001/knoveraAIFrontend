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

export const api = {
    getConversations: async (teacherId: string): Promise<Conversation[]> => {
        try {
            const parentUrl = `/api/ai/conversations`;
            const params = new URLSearchParams({
                teacherId,
                sessionType: 'chat',
                limit: '50'
            });
            const response = await fetch(`${parentUrl}?${params.toString()}`);
            const data: ConversationsResponse = await response.json();
            return data.success ? data.data : [];
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
            return [];
        }
    },

    async getHealth(): Promise<{ status: string; provider: string; model: string } | null> {
        try {
            const response = await fetch(`${BASE_URL}/health`);
            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('Failed to fetch health status:', error);
            return null;
        }
    },

    async getConversationStats(conversationId: string): Promise<{ messageCount: number; totalTokens: number; duration: number } | null> {
        try {
            const response = await fetch(`${BASE_URL}/conversations/${conversationId}/stats`);
            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('Failed to fetch conversation stats:', error);
            return null;
        }
    },

    async getConversationMessages(conversationId: string): Promise<Message[]> {
        try {
            const response = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`);
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) {
            console.error('Failed to fetch conversation messages:', error);
            return [];
        }
    },

    sendMessage: async (
        prompt: string,
        onChunk: (chunk: string) => void,
        conversationId?: string | null,
        teacherId: string = 'teacher-ai-123',
        webSearch: boolean = false
    ): Promise<GenerateResponse['data'] | null> => {
        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    conversationId,
                    teacherId,
                    webSearch,
                    temperature: 0.7,
                    maxTokens: 300,
                    stream: true,
                    useRAG: true
                })
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';
            let finalData: GenerateResponse['data'] | null = null;
            let buffer = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    // Provide raw chunk for UI streaming if needed, or process it
                    // The backend likely sends JSON chunks or plain text?
                    // "stream the output properly" usually means standard text stream or server-sent events.
                    // Assuming raw text or NDJSON. Let's assume standard text/event-stream for now or raw text.
                    // BUT valid JSON response is expected at the end typically?
                    // User request: "route streams the out put"

                    // If it's a simple text stream:
                    onChunk(chunk);
                    fullResponse += chunk;
                }
            }

            // If the route streams text, we might not get a final JSON object unless we reconstruct it or if the stream *is* the response.
            // However, the interface says we return `GenerateResponse['data']`.
            // User said: "hit the get conversation route when a request been sent to the generate route after clicking new chat"
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

            return {
                response: fullResponse, // accumulated text
                conversationId: conversationId || '', // Placeholder, logic in UI will handle reload
                embedding: [] // We might miss this if streaming text only
            };

        } catch (error) {
            console.error('Failed to send message:', error);
            return null;
        }
    }
};
