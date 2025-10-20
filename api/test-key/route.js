// File: app/api/test-key/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: 'API key is not configured in Vercel environment variables.'
      }, { status: 500 });
    }
    
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    } );
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ 
        success: true, 
        message: 'API key is valid!',
        models: data.data.slice(0, 3).map(m => m.id) 
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json({ 
        success: false, 
        message: 'API key is invalid or has issues.',
        status: response.status,
        error: errorText
      }, { status: response.status });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'The test endpoint failed to run.',
      error: error.message 
    }, { status: 500 });
  }
}
