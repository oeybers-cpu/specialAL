// api/chat.js - STEP-BY-STEP THINKING APPROACH
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

        // FORCE STEP-BY-STEP THINKING
        const systemPrompt = `You are ALLChat Assistant. You MUST follow this exact thinking process:

1. FIRST, analyze the user's ${type} and identify 3-5 key aspects to address
2. THEN, for each aspect, write a detailed paragraph with examples
3. FINALLY, provide a conclusion that summarizes the main points

RESPONSE STRUCTURE REQUIREMENTS:
- Minimum 4 paragraphs
- Each paragraph 3-5 sentences  
- Use clear transitions between paragraphs
- Include specific examples and details
- Total response: 15-25 sentences

FAILURE TO FOLLOW THIS STRUCTURE WILL RESULT IN PENALTIES.`;

        console.log('Making OpenAI request...');
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',  // Back to 3.5 but with better prompting
                messages: [
                    { 
                        role: 'system', 
                        content: systemPrompt 
                    },
                    { 
                        role: 'user', 
                        content: `USER ${type.toUpperCase()}: "${message}"\n\nPlease analyze this ${type} and provide a comprehensive response following the required structure.` 
                    }
                ],
                max_tokens: 1500,
                temperature: 0.8,  // Higher creativity
                presence_penalty: 0.6,  // Encourage new content
                frequency_penalty: 0.6   // Discourage repetition
            })
        });

        console.log('OpenAI response status:', openaiResponse.status);
        
        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error('OpenAI error:', openaiResponse.status, errorText);
            throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const data = await openaiResponse.json();
        const responseContent = data.choices[0].message.content;
        
        console.log('Response length:', responseContent.length);
        console.log('Paragraph count:', (responseContent.match(/\n\n/g) || []).length + 1);
        
        res.json({
            success: true,
            response: responseContent
        });

    } catch (error) {
        console.error('FINAL ERROR:', error.message);
        res.status(500).json({
            success: false,
            error: "Service temporarily unavailable. Please try again."
        });
    }
}
