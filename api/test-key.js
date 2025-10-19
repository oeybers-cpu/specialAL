// api/test-key.js
export default async function handler(req, res) {
    try {
        console.log('Testing API key...');
        console.log('Key exists:', !!process.env.OPENAI_API_KEY);
        console.log('Key starts with:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'none');
        
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        
        console.log('OpenAI API test status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            res.json({ 
                success: true, 
                message: 'API key is valid!',
                models: data.data.slice(0, 3).map(m => m.id) // Show first 3 available models
            });
        } else {
            const error = await response.text();
            res.json({ 
                success: false, 
                message: 'API key is invalid or has issues',
                status: response.status,
                error: error
            });
        }
    } catch (error) {
        res.json({ 
            success: false, 
            message: 'Test failed completely',
            error: error.message 
        });
    }
}
