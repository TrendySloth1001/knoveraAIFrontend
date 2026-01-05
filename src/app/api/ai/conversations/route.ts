import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('authToken')?.value || req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    
    // Forward all query parameters
    const queryString = searchParams.toString();
    const backendUrl = `http://localhost:3001/api/ai/conversations?${queryString}`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}),
      },
    });

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
