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
    const { searchParams } = new URL(req.url);
    
    // Check if it's stats or messages endpoint
    const path = req.nextUrl.pathname;
    let backendUrl = `http://localhost:3001/api/ai/conversations/${id}`;
    
    if (path.includes('/stats')) {
      backendUrl += '/stats';
    } else if (path.includes('/messages')) {
      backendUrl += '/messages';
    }
    
    // Add query parameters if any
    const queryString = searchParams.toString();
    if (queryString) {
      backendUrl += `?${queryString}`;
    }
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}),
      },
    });

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Conversation detail API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params;
    const token = req.cookies.get('authToken')?.value || req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    
    const queryString = searchParams.toString();
    const backendUrl = `http://localhost:3001/api/ai/conversations/${id}?${queryString}`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}),
      },
    });

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Delete conversation API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
