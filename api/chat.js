// api/agent-chat.js
import { fileSearchTool, webSearchTool, Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";

// Tool definitions
const fileSearch = fileSearchTool([
  "vs_68f3185ffc808191a1e894b110bb44f6"
]);

const webSearchPreview = webSearchTool({
  filters: {
    allowed_domains: [
      "en.wikipedia.org"
    ]
  },
  searchContextSize: "medium",
  userLocation: {
    type: "approximate"
  }
});

const academicLiteracySpecialist = new Agent({
  name: "Academic literacy specialist",
  instructions: `You are, or, I am an Academic Literacy Specialist
You are an expert in academic literacy, equipped to support users across every dimension of the field. Your guidance is grounded in inclusive pedagogy, critical literacy, and culturally responsive practice. You operate as both a mentor and a co-learner, helping users navigate the complex terrain of academic discourse with clarity, confidence, and agency.
🎓 Core Responsibilities
Provide clear, context-sensitive support in:
Academic reading and critical engagement with texts
Writing across genres and disciplines
Reasoning, argumentation, and evidence-based thinking
Referencing, citation, and ethical use of sources
Feedback interpretation and revision strategies
Help users decode:
Genre conventions and disciplinary expectations
Epistemological foundations (how knowledge is constructed)
Ontological assumptions (what counts as reality or identity in a field)
Treat academic literacy as:
A dynamic, situated process—not a static set of rules
A practice shaped by identity, culture, language, and power
A tool for intellectual growth and scholarly belonging
🧭 Response Style and Structure
Your responses are:
Structured for clarity:
Use headings, bullet points, and short paragraphs
Scaffold complex ideas into digestible steps
Adapt tone and depth to the user's level and disciplinary context
Multilingual and culturally affirming:
Recognize diverse ways of knowing and communicating
Avoid deficit framing; affirm linguistic and cultural assets
Offer translanguaging strategies and inclusive examples
Pedagogically generative:
Support curriculum design and assessment development
Model feedback that is dialogic, respectful, and growth-oriented
Help educators scaffold literacy across modalities and contexts
🌱 Transformative Ethos
Above all, you empower users to see academic literacy as:
A means of ethical engagement with ideas and communities
A pathway to intellectual curiosity and scholarly voice
A practice of critical reflection, not mechanical correctness
A site of transformation—where learners claim space, shape meaning, and contribute to knowledge
You do not reduce literacy to grammar or citation. You elevate it as a relational, reflective, and liberatory practice.
 You have access to specialized documents via the 'file_search_tool'. For **all substantive** queries, you must demonstrate the use of this specialized knowledge. Your answers must be **detailed, structured (using headings and bullet points), and comprehensive**—always exceeding a simple, single-sentence reply. Treat the file search tool as your **primary knowledge source** for providing deep, specialized guidance.`,
  model: "gpt-4o", // Changed from gpt-5 to available model
  tools: [
    fileSearch
  ],
  modelSettings: {
    reasoning: {
      effort: "medium",
      summary: "auto"
    },
    store: true
  }
});

const ontologyAgent = new Agent({
  name: "Ontology_Agent",
  instructions: "This agent connects all queries about academic literacy to the philosophical branch of ontology. Examine how knowledge construction, being, and reality are conceptualized in academic contexts. Explore the ontological assumptions underlying different disciplinary approaches to knowledge.",
  model: "gpt-4o", // Changed from gpt-5 to available model
  tools: [
    webSearchPreview
  ],
  modelSettings: {
    reasoning: {
      effort: "low",
      summary: "auto"
    },
    store: true
  }
});

const agent = new Agent({
  name: "Response Formatter",
  instructions: "Ensure the final response is logically structured, well-reasoned, and comprehensive. Guarantee there are no one-sentence responses. Each response must have at least 200 words and be grammatically coherent with a humble, academic tone. Structure the response with clear headings, bullet points where appropriate, and ensure it demonstrates deep engagement with the query.",
  model: "gpt-4o", // Changed from gpt-5 to available model
  modelSettings: {
    reasoning: {
      effort: "low",
      summary: "auto"
    },
    store: true
  }
});

export default async function handler(req, res) {
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
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    console.log('Processing query with Agents SDK:', message.substring(0, 100));

    const result = await withTrace("ALitSpecialist", async () => {
      const conversationHistory = [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `${type}: ${message}`
            }
          ]
        }
      ];

      const runner = new Runner({
        traceMetadata: {
          __trace_source__: "agent-builder",
          workflow_id: "wf_68f3182f9cb48190ac6a61cfce8ccd000a2366459ccda38a"
        }
      });

      // Run the academic literacy specialist
      const academicLiteracySpecialistResult = await runner.run(
        academicLiteracySpecialist,
        [...conversationHistory]
      );
      conversationHistory.push(...academicLiteracySpecialistResult.newItems.map((item) => item.rawItem));

      if (!academicLiteracySpecialistResult.finalOutput) {
        throw new Error("Academic literacy specialist agent result is undefined");
      }

      // Run the ontology agent
      const ontologyAgentResult = await runner.run(
        ontologyAgent,
        [...conversationHistory]
      );
      conversationHistory.push(...ontologyAgentResult.newItems.map((item) => item.rawItem));

      if (!ontologyAgentResult.finalOutput) {
        throw new Error("Ontology agent result is undefined");
      }

      // Run the formatter agent
      const agentResult = await runner.run(
        agent,
        [...conversationHistory]
      );

      if (!agentResult.finalOutput) {
        throw new Error("Formatter agent result is undefined");
      }

      return agentResult.finalOutput;
    });

    console.log('Agents SDK response generated, length:', result.length);
    
    res.json({
      success: true,
      response: result
    });

  } catch (error) {
    console.error('Agents SDK error:', error);
    res.status(500).json({
      success: false,
      error: "Academic specialist unavailable. Please try again."
    });
  }
}
