import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic'; // Disable caching

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.cookies.get('authToken')?.value || req.headers.get('authorization');

    // Forward request to backend
    const backendUrl = 'http://localhost:3001/api/ai/generate';
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    // For streaming responses
    if (body.stream && backendResponse.body) {
      // Return the stream directly without buffering
      return new Response(backendResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no', // Disable nginx buffering if applicable
        },
      });
    }

    // For non-streaming responses
    const data = await backendResponse.json();
    return Response.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
