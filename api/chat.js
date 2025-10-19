// api/chat.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { message, type } = req.body;

        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Message is required' 
            });
        }

        // Call OpenAI API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are ALLChat Assistant, a helpful and friendly AI assistant. 
                                Users can ask questions or post comments. 
                                
                                Guidelines:
                                - Be engaging, conversational, and helpful
                                - If it's a question, provide clear, informative answers
                                - If it's a comment, engage in meaningful conversation
                                - Keep responses concise but thorough (2-4 paragraphs max)
                                - Use a friendly and professional tone
                                - If you don't know something, be honest about it
                                - Format your responses with clear paragraphs using \\n\\n for line breaks`
                    },
                    {
                        role: 'user',
                        content: `${type === 'Question' ? 'Question:' : 'Comment:'} ${message}`
                    }
                ],
                max_tokens: 800,
                temperature: 0.7
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.text();
            console.error('OpenAI API error:', openaiResponse.status, errorData);
            throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const data = await openaiResponse.json();

        if (data.choices && data.choices[0]) {
            res.status(200).json({
                success: true,
                response: data.choices[0].message.content
            });
        } else {
            throw new Error('No response from OpenAI');
        }

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get response from AI assistant'
        });
    }
}
