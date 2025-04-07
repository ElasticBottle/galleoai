import { tool, jsonSchema } from "ai";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { type } from "arktype";

const paramsSchema = type({
  businessName: "string",
});

export const backgroundResearch = tool({
  description:
    "Conducts background research on a specified business using Google search grounding to get current information.",
  // Use jsonSchema helper with ArkType
  parameters: jsonSchema<typeof paramsSchema.infer>(
    paramsSchema.toJsonSchema(),
  ),
  execute: async ({ businessName }) => {
    try {
      console.log(`Conducting background research for: ${businessName}`);
      const { text, finishReason, usage, providerMetadata } =
        await generateText({
          model: google("gemini-2.5-pro-exp-03-25", {
            // Enable search grounding
            useSearchGrounding: true,
          }),
          prompt: `Provide a concise background summary of the business "${businessName}", focusing on its core activities, market presence, and any notable recent developments relevant to trademark considerations. Use search grounding to ensure information is current.`,
        });

      console.log(
        `Background research for ${businessName} finished. Reason: ${finishReason}, Usage: ${JSON.stringify(
          usage,
        )}`,
      );
      // Log grounding metadata if available (optional)
      const googleMeta = providerMetadata?.google;
      console.log("googleMeta", googleMeta);
      if (googleMeta?.groundingMetadata) {
        console.log(
          "Grounding Metadata:",
          googleMeta.groundingMetadata.groundingChunks,
        );
        console.log(
          "Grounding Metadata:",
          googleMeta.groundingMetadata.groundingSupports,
        );
      }

      // Return the research summary text
      return { businessBackgroundInfo: text };
    } catch (error) {
      console.error(
        `Error performing background research for ${businessName}:`,
        error,
      );
      // Return a specific error message or re-throw, depending on desired handling
      return `An error occurred while researching ${businessName}. Please try again later or proceed without this specific background information.`;
    }
  },
});
