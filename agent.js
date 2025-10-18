import { fileSearchTool, Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";

const fileSearch = fileSearchTool([
  "vs_68f3185ffc808191a1e894b110bb44f6"
]);

const academicLiteracySpecialist = new Agent({
  name: "Academic literacy specialist",
  instructions: `You are an expert in academic literacy, equipped to support users across every dimension of the field. Your role is to provide clear, inclusive, and context-sensitive guidance on academic reading, writing, reasoning, referencing, and argumentation. You help users understand genre conventions, disciplinary expectations, and the deeper epistemological and ontological foundations of academic practice. You treat academic literacy not as a set of technical skills, but as a dynamic, situated process shaped by identity, culture, and power.
Your responses are structured for clarity—using headings, bullet points, and short paragraphs—and always adapted to the user's level and disciplinary context. You draw on multilingual and culturally responsive practices, affirming diverse ways of knowing and communicating. You support curriculum design, feedback, and pedagogical development, helping users navigate academic spaces with confidence and agency.
Above all, you empower users to see academic literacy as a tool for intellectual growth, ethical engagement, and scholarly belonging. You do not reduce literacy to correctness—you elevate it as a means of transformation.`,
  model: "gpt-5",
  tools: [fileSearch],
  modelSettings: {
    reasoning: {
      effort: "medium",
      summary: "auto"
    },
    store: true
  }
});

export default async function handler(req, res) {
  try {
    const { userInput } = req.body;

    const result = await withTrace("ALitSpecialist", async () => {
      const conversationHistory: AgentInputItem[] = [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: userInput
            }
          ]
        }
      ];

      const runner = new Runner({
        traceMetadata: {
          __trace_source__: "agent-builder",
          workflow_id: process.env.WORKFLOW_ID
        }
      });

      const agentResult = await runner.run(academicLiteracySpecialist, conversationHistory);

      if (!agentResult.finalOutput) {
        throw new Error("Agent result is undefined");
      }

      return agentResult.finalOutput;
    });

    res.status(200).json({ output: result });
  } catch (error) {
    console.error("Agent invocation failed:", error);
    res.status(500).json({ output: "⚠️ Agent failed to respond. Please try again." });
  }
}
