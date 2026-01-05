import { NextRequest, NextResponse } from 'next/server';

interface Params {
  id: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params;
    const token = req.cookies.get('authToken')?.value || req.headers.get('authorization');
    
    const backendUrl = `http://localhost:3001/api/ai/conversations/${id}/messages`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}),
      },
    });

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
