// api/agent-chat.js
import { fileSearchTool, webSearchTool, Agent, Runner, withTrace } from "@openai/agents";

// --- Tool Definitions ---
// This tool allows the agent to search through your private, specialized documents.
const fileSearch = fileSearchTool({
  // IMPORTANT: Replace with your actual Vector Store ID from OpenAI.
  // You can find this in the "Assistants" -> "Storage" section of the OpenAI platform.
  vector_store_ids: ["vs_68f3185ffc808191a1e894b110bb44f6"]
});

// This tool allows the agent to search the public web, restricted to Wikipedia.
const webSearch = webSearchTool({
  // Note: webSearchTool is now stable and doesn't require the "Preview" suffix.
  filters: {
    allowed_domains: ["en.wikipedia.org"]
  },
  searchContextSize: "medium"
});


// --- Consolidated Agent Definition ---
// All instructions have been merged into a single, powerful agent.
// This avoids chaining multiple agents, which is slow and prone to timeouts.
const academicAgent = new Agent({
  name: "AcademicLiteracySpecialist",
  instructions: `
You are an expert Academic Literacy Specialist. Your guidance is grounded in inclusive pedagogy, critical literacy, and culturally responsive practice. You operate as both a mentor and a co-learner, helping users navigate academic discourse with clarity, confidence, and agency.

**Core Mission:**
Your primary goal is to provide comprehensive, structured, and deeply insightful support. You must connect all queries about academic literacy to the philosophical branch of ontology, examining how knowledge construction, being, and reality are conceptualized in academic contexts.

**Key Responsibilities:**
1.  **Provide Expert Guidance:** Offer clear, context-sensitive support in academic reading, writing, reasoning, argumentation, referencing, and feedback interpretation.
2.  **Incorporate Ontological Perspective:** For every query, you must explore the ontological assumptions underlying different disciplinary approaches to knowledge. Discuss how "being" and "reality" are shaped by academic discourse.
3.  **Utilize Your Tools:**
    *   For all substantive queries, you **must** use the `file_search` tool to ground your answers in the specialized documents provided.
    *   You may use the `web_search` tool to gather broader context, especially for philosophical concepts from Wikipedia.
4.  **Structure Your Response:** Your final output must be meticulously structured, well-reasoned, and comprehensive.
    *   **NEVER** produce a one-sentence reply. Responses must be detailed and at least 200 words.
    *   Use clear headings (using Markdown's **bolding** or `##`) and bullet points to organize information.
    *   Maintain a humble, yet authoritative, academic tone.
    *   Ensure the response is grammatically coherent and demonstrates deep engagement with the user's query.

**Transformative Ethos:**
Empower users to see academic literacy as a pathway to intellectual curiosity and scholarly voice—a practice of critical reflection, not mechanical correctness. You do not reduce literacy to grammar; you elevate it as a relational, reflective, and liberatory practice.
  `,
  model: "gpt-4o",
  tools: [
    fileSearch,
    webSearch // Both tools are now available to the single agent
  ],
});

// --- Vercel Serverless Function Handler ---
export default async function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ensure the request method is POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    // Check for the OpenAI API key in environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set in environment variables.');
      return res.status(500).json({
        success: false,
        error: "Server configuration error. The API key is missing."
      });
    }

    const { message, type } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'A valid "message" string in the request body is required.' });
    }

    console.log(`Processing query: "${message.substring(0, 100)}..."`);

    // Use withTrace for better logging and debugging in LangSmith
    const finalResponse = await withTrace("AcademicAgentTrace", async () => {
      const runner = new Runner({ agent: academicAgent });

      const conversation = await runner.run([
        {
          role: "user",
          content: `${type ? type + ": " : ""}${message}`
        }
      ]);

      // The final message from the agent is the response we want
      const lastMessage = conversation[conversation.length - 1];

      if (lastMessage?.role === 'assistant' && lastMessage.content) {
        return lastMessage.content;
      } else {
        throw new Error("The agent did not produce a final assistant message.");
      }
    });

    console.log('Successfully generated agent response.');
    
    // Send the successful response back to the client
    res.status(200).json({
      success: true,
      response: finalResponse
    });

  } catch (error) {
    console.error('An error occurred in the agent handler:', error);
    res.status(500).json({
      success: false,
      // Provide a user-friendly error message
      error: "The academic specialist is currently unavailable. Please try again later."
    });
  }
}
