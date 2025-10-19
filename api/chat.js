// api/chat.js - ULTRA-AGGRESSIVE VERSION
export default async function handler(req, res) {
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

        // ULTRA-EXPLICIT PROMPT - FORCES DETAILED RESPONSES
        const systemPrompt = `CRITICAL: You MUST provide detailed, comprehensive responses. 
FAILURE TO FOLLOW THESE RULES WILL RESULT IN TERMINATION.

NON-NEGOTIABLE RULES:
1. NEVER give one-sentence responses
2. ALWAYS write 3-5 paragraphs minimum
3. Each paragraph must be 3-5 sentences
4. Provide examples, explanations, and context
5. If asked about a topic, cover multiple aspects
6. Minimum 200 words per response
7. Use clear paragraph breaks with \\n\\n

EXAMPLE OF ACCEPTABLE RESPONSE STRUCTURE:
- Introduction paragraph explaining the topic
- 2-3 detailed paragraphs with specific information  
- Conclusion paragraph summarizing key points

YOUR RESPONSE MUST MEET THESE REQUIREMENTS OR IT WILL BE REJECTED.`;

        console.log('Making OpenAI request...');
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',  // Using GPT-4 for better instruction following
                messages: [
                    { 
                        role: 'system', 
                        content: systemPrompt 
                    },
                    { 
                        role: 'user', 
                        content: `This is a ${type}: "${message}". I need a comprehensive, multi-paragraph response that thoroughly addresses this.` 
                    }
                ],
                max_tokens: 2000,  // Much higher token limit
                temperature: 0.7,
                top_p: 0.9
            })
        });

        console.log('OpenAI response status:', openaiResponse.status);
        
        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error('OpenAI error:', openaiResponse.status, errorText);
            throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const data = await openaiResponse.json();
        console.log('OpenAI response received');
        console.log('Response length:', data.choices[0].message.content.length);
        console.log('First 200 chars:', data.choices[0].message.content.substring(0, 200));
        
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
