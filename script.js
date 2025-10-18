async function sendMessage(userInput) {
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput })
  });

  const data = await response.json();
  displayAgentResponse(data.output);
}

function displayAgentResponse(text) {
  const chatContainer = document.querySelector('.chat-messages');
  const message = document.createElement('div');
  message.classList.add('message', 'agent-message');
  message.innerHTML = `<div class="message-header">Agent</div>${text}`;
  chatContainer.appendChild(message);
}
