import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  try {
    const { userInput, workflow_id, project_id } = req.body;

    const response = await openai.beta.agents.invoke({
      agent_id: process.env.AGENT_ID, // Set this in Vercel env vars
      input: userInput,
      workflow_id,
      project_id
    });

    const output = response.output || '[No response received]';
    res.status(200).json({ output });
  } catch (error) {
    console.error('Agent invocation failed:', error);
    res.status(500).json({ output: '⚠️ Agent failed to respond. Please try again.' });
  }
}

