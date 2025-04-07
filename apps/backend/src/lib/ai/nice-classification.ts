import { type } from "arktype";
import { tool, generateObject, jsonSchema } from "ai";
import { niceClassificationModel } from "./models";
import { niceClassificationData } from "./nice-data";

// Define the input schema for the tool using ArkType
const paramsSchema = type({
  backgroundInfo: "string",
});

// Define the output schema for the classification result
const classificationResultSchema = type({
  class: "number",
  reasoning: "string",
});

// Define the output schema for the generateObject call
const outputSchema = type({
  classification: [classificationResultSchema, "[]"],
});

// Format the NICE data for inclusion in the prompt
const niceDataPromptSection = niceClassificationData
  .map((item) => `Class ${item.class}: ${item.description}`)
  .join("\n");

export const niceClassification = tool({
  description:
    "Classifies a business activity based on background information according to the official NICE classification system. Provides relevant class numbers and reasoning.",
  parameters: jsonSchema<typeof paramsSchema.infer>(
    paramsSchema.toJsonSchema(),
  ),
  execute: async ({ backgroundInfo }) => {
    console.log(
      `Executing niceClassification tool with background: ${backgroundInfo.substring(0, 100)}...`,
    );
    try {
      const { object } = await generateObject({
        model: niceClassificationModel, // Use the dedicated model
        schema: jsonSchema<typeof outputSchema.infer>(
          outputSchema.toJsonSchema(),
        ),
        prompt: `Analyze the following business background information and determine the most relevant NICE classification(s).
        
        Background Information:
        --- Start Background --- 
        ${backgroundInfo}
        --- End Background ---

        Reference NICE Classification List:
        --- Start NICE List ---
        ${niceDataPromptSection}
        --- End NICE List ---

        Respond ONLY with the JSON object matching the requested schema, providing the class number and your reasoning for each relevant classification based *only* on the provided background information and the NICE list.
        If multiple classes seem relevant, include them all.
        If no classes seem relevant or the information is insufficient, return an empty array for 'classification'.`,
        mode: "json",
      });
      console.log("niceClassification tool result:", object);
      return object; // Return the structured data
    } catch (error) {
      console.error("Error executing niceClassification tool:", error);
      // Return a structured error or an empty result
      return { classification: [] };
    }
  },
});
