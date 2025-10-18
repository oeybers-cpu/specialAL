const response = await fetch('https://api.openai.com/v1/agents/YOUR_AGENT_ID/invoke', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    input: userInput,
    workflow_id: WORKFLOW_ID,
    project_id: PROJECT_ID
  })
});
