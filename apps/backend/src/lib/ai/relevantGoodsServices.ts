import { type } from "arktype";
import { tool, generateObject, jsonSchema } from "ai";
import { goodsServicesModel } from "./models";

// --- MOCK DATA --- (Replace with actual data source: API, DB, etc.)
const mockPreapprovedGoodsServices = {
  // Class 3: Cosmetics, cleaning
  3: [
    "Bleaching preparations for laundry use",
    "Cleaning preparations",
    "Polishing preparations",
    "Abrasive preparations",
    "Soaps",
    "Perfumery",
    "Essential oils",
    "Non-medicated cosmetics",
    "Non-medicated hair lotions",
    "Non-medicated dentifrices",
  ],
  // Class 9: Scientific, tech, software
  9: [
    "Computers",
    "Computer software, recorded",
    "Computer peripheral devices",
    "Downloadable computer software applications",
    "Data processing apparatus",
    "Measuring apparatus",
    "Signalling apparatus",
    "Optical apparatus and instruments",
    "Audiovisual apparatus",
  ],
  // Class 35: Advertising, business
  35: [
    "Advertising services",
    "Business management assistance",
    "Business administration services",
    "Providing office functions",
    "Online advertising on a computer network",
    "Sales promotion for others",
    "Marketing services",
    "Data search in computer files for others",
  ],
  // Add more mock classes/services as needed
};
// --- END MOCK DATA ---

// Input schema: expects the classification result from the previous tool
const classificationInputSchema = type({
  class: "number",
  reasoning: "string",
});
const paramsSchema = type({
  classifications: [classificationInputSchema, "[]"],
  backgroundInfo: "string", // Include background for better context
});

// Output schema for the tool
const outputSchema = type({
  relevantServices: "string[]",
});

export const relevantGoodsServices = tool({
  description:
    "Suggests relevant goods and services from the Singapore preapproved list based on provided NICE classifications and business background.",
  parameters: jsonSchema<typeof paramsSchema.infer>(
    paramsSchema.toJsonSchema(),
  ),
  execute: async ({ classifications, backgroundInfo }) => {
    console.log("Executing relevantGoodsServices tool...");
    console.log("Classifications:", classifications);

    if (!classifications || classifications.length === 0) {
      console.log("No classifications provided.");
      return { relevantServices: [] };
    }

    // Prepare the relevant mock data based on input classes
    let relevantMockDataPromptSection =
      "Relevant Preapproved Goods/Services (Examples):\n";
    let foundData = false;
    for (const { class: classNum } of classifications) {
      const services =
        mockPreapprovedGoodsServices[
          classNum as keyof typeof mockPreapprovedGoodsServices
        ];
      if (services) {
        relevantMockDataPromptSection += `Class ${classNum}:\n - ${services.join("\n - ")}\n`;
        foundData = true;
      }
    }

    if (!foundData) {
      relevantMockDataPromptSection +=
        "No specific examples found for the provided class(es) in the current list.";
    }

    // Add type annotation for map callback parameter
    const classificationsText = classifications
      .map(
        (c: { class: number; reasoning: string }) =>
          `- Class ${c.class}: ${c.reasoning}`,
      )
      .join("\n");

    try {
      const { object } = await generateObject({
        model: goodsServicesModel,
        schema: jsonSchema<typeof outputSchema.infer>(
          outputSchema.toJsonSchema(),
        ),
        prompt: `Based on the following business background information, the suggested NICE classifications, and the provided examples from the Singapore preapproved list, identify and list the *most relevant* specific goods and services that should be included in a trademark application. 

        Business Background:
        --- Start Background ---
        ${backgroundInfo}
        --- End Background ---

        Suggested NICE Classifications:
        ${classificationsText}
        
        ${relevantMockDataPromptSection}

        Instructions:
        - Focus on specificity. Select items directly from the provided examples if they fit the background.
        - If the examples are insufficient but the background suggests other standard items for the class, you may infer *very common* ones (e.g., 'computer software' for Class 9 if background is software development).
        - Do NOT invent niche or overly specific items not commonly found on preapproved lists.
        - Aim for a concise list of the *most* applicable items.
        - Return ONLY the JSON object matching the schema with the list of strings.
        - If no relevant services can be determined, return an empty array.
        `,
        mode: "json",
      });
      console.log("relevantGoodsServices tool result:", object);
      return object;
    } catch (error) {
      console.error("Error executing relevantGoodsServices tool:", error);
      return { relevantServices: [] };
    }
  },
});
