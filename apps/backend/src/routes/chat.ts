import { Hono } from "hono";
import { streamText, type CoreMessage } from "ai";
import { mainAgentModel } from "../lib/ai/models";
// Import tools
import { niceClassification } from "../lib/ai/niceClassification";
import { relevantGoodsServices } from "../lib/ai/relevantGoodsServices";
import { markFilingRecommendation } from "../lib/ai/markFilingRecommendation";
import { chatRequestSchema } from "@/schemas/chat";
import { arktypeValidator } from "@hono/arktype-validator";

// Define the system prompt
const systemPrompt = `You are an expert Singapore trademark law assistant working for a prestigious law firm.
Your primary goal is to understand the user's request regarding trademark registration, ask clarifying questions if necessary, and utilize the provided tools to gather information about background context, NICE classification, and relevant goods/services.

Once you have sufficient information, your final output MUST be a draft email addressed to the client.
This email should:
1.  Acknowledge and clearly answer all aspects of the client's original query.
2.  Summarize the findings from your research (background, classification, goods/services).
3.  Provide preliminary recommendations based on the findings (e.g., potential classes to file under, type of mark considerations).
4.  Politely nudge the client towards engaging the firm for formal filing and consultation, highlighting the firm's expertise.
5.  Maintain a professional, helpful, and confident tone.

Do not provide definitive legal advice, but rather informed recommendations based on the gathered data. Always qualify your recommendations appropriately (e.g., "Based on preliminary analysis...", "We would recommend further consultation to confirm...").
Use markdown for formatting the email draft.`;

// Define the POST route for chat requests
const chat = new Hono().post(
  "/",
  arktypeValidator("json", chatRequestSchema),
  async (c) => {
    // const { messages } = c.req.valid("json");
    console.log("c.req", c.req);

    // Define and import actual tools
    const tools = {
      niceClassification: niceClassification,
      relevantGoodsServices: relevantGoodsServices,
      markFilingRecommendation: markFilingRecommendation,
    };

    try {
      const result = await streamText({
        model: mainAgentModel, // Use the main agent model
        system: systemPrompt,
        messages: [] as CoreMessage[], // Pass validated messages (includes multimodal content)
        tools: tools,
        // Enable Google Search grounding
        experimental_providerMetadata: {
          google: {
            useSearchGrounding: true,
          },
        },
      });

      // Respond with the streaming data response
      return result.toDataStreamResponse();
    } catch (error) {
      console.error("Error calling streamText:", error);
      // Consider returning a more informative error response
      return c.json({ error: "Failed to process chat request" }, 500);
    }
  },
);

export default chat;
