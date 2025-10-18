async function sendMessage(userInput) {
  if (!userInput.trim()) return;

  showTypingIndicator();

  try {
    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    displayAgentResponse(data.output || '[No response received]');
  } catch (error) {
    console.error('Agent fetch failed:', error);
    displayAgentResponse('⚠️ Sorry, something went wrong. Please try again.');
  } finally {
    hideTypingIndicator();
  }
}

function displayAgentResponse(text) {
  const chatContainer = document.querySelector('.chat-messages');
  const message = document.createElement('div');
  message.classList.add('message', 'agent-message');
  message.innerHTML = `<div class="message-header">Agent</div>${text}`;
  chatContainer.appendChild(message);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTypingIndicator() {
  const indicator = document.querySelector('.typing-indicator');
  if (indicator) indicator.style.display = 'block';
}

function hideTypingIndicator() {
  const indicator = document.querySelector('.typing-indicator');
  if (indicator) indicator.style.display = 'none';
}
