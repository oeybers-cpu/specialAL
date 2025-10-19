// api/chat.js - CLEAN VERSION
export default async function handler(req, res) {
    // Log that we're starting
    console.log('=== CHAT API CALLED ===');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { message, type } = req.body;
        console.log('Received:', { message, type });

        if (!message) {
            return res.status(400).json({ success: false, error: 'No message' });
        }

        // SIMPLE TEST PROMPT - let's get this working first
        const systemPrompt = "You are a helpful assistant. Provide detailed responses.";

        console.log('Making OpenAI request with key:', process.env.OPENAI_API_KEY ? 'Key exists' : 'NO KEY');
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        console.log('OpenAI response status:', openaiResponse.status);
        
        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error('OpenAI error:', openaiResponse.status, errorText);
            throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const data = await openaiResponse.json();
        console.log('OpenAI response received successfully');
        
        res.json({
            success: true,
            response: data.choices[0].message.content
        });

    } catch (error) {
        console.error('FINAL ERROR:', error.message);
        res.status(500).json({
            success: false,
            error: "Service temporarily unavailable. Please try again."
        });
    }
}
