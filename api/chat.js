// api/chat.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { message, type } = req.body;

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
                        content: `You are ALLChat Assistant, a helpful AI. Users can ask questions or post comments. 
                                Be friendly, engaging, and provide helpful responses. 
                                If it's a question, provide informative answers. 
                                If it's a comment, engage in meaningful conversation.`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

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
        console.error('OpenAI API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get response from AI'
        });
    }
}
