import { tool, generateObject, jsonSchema } from "ai";
import { type } from "arktype";
import { mainAgentModel } from "./models"; // Use main model for potentially more complex reasoning

// Input schema
const classificationInfoSchema = type({
  class: "number",
  reasoning: "string",
});

const paramsSchema = type({
  backgroundInfo: "string",
  classifications: [classificationInfoSchema, "[]"],
  relevantServices: "string[]",
  // Optional: Add markType if it can be reliably extracted or is asked for
  // markType: "'word' | 'logo' | 'combined' | 'other'?",
});

// Output schema
const recommendationSchema = type({
  recommendation: "string",
  category:
    "'General' | 'Mark Type' | 'Classification' | 'Goods/Services' | 'Next Steps'",
});

const outputSchema = type({
  filingRecommendations: [recommendationSchema, "[]"],
});

export const markFilingRecommendation = tool({
  description:
    "Provides actionable recommendations for trademark filing based on the analyzed background, classifications, and relevant goods/services.",
  parameters: jsonSchema<typeof paramsSchema.infer>(
    paramsSchema.toJsonSchema(),
  ),
  execute: async ({ backgroundInfo, classifications, relevantServices }) => {
    console.log("Executing markFilingRecommendation tool...");

    const classificationsText = classifications
      .map(
        (c: { class: number; reasoning: string }) =>
          `- Class ${c.class}: ${c.reasoning}`,
      )
      .join("\n");
    const servicesText = relevantServices.join(", ");

    try {
      const { object } = await generateObject({
        model: mainAgentModel, // Use a powerful model for nuanced recommendations
        schema: jsonSchema<typeof outputSchema.infer>(
          outputSchema.toJsonSchema(),
        ),
        prompt: `Given the following business background, NICE classifications, and identified goods/services, provide actionable recommendations for a Singapore trademark filing.

        Business Background:
        --- Start Background ---
        ${backgroundInfo}
        --- End Background ---

        Identified NICE Classifications:
        ${classificationsText || "None identified."}

        Relevant Goods/Services:
        ${servicesText || "None identified."}

        Instructions:
        - Generate a list of concise, actionable recommendations.
        - Categorize each recommendation (e.g., 'Mark Type', 'Classification', 'Goods/Services', 'Next Steps').
        - Consider potential issues or points of attention (e.g., if the background mentions a descriptive term, recommend considering distinctiveness; if multiple classes, suggest filing strategy).
        - Include a recommendation related to next steps, such as performing a clearance search or consulting with the firm.
        - Phrase recommendations clearly and professionally.
        - Do NOT give definitive legal advice.
        - Return ONLY the JSON object matching the schema.
        - If insufficient information is available for meaningful recommendations, return an empty array.
        `,
        mode: "json",
      });
      console.log("markFilingRecommendation tool result:", object);
      return object;
    } catch (error) {
      console.error("Error executing markFilingRecommendation tool:", error);
      return { filingRecommendations: [] };
    }
  },
});
