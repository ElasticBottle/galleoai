import { scope } from "arktype";

// Define a scope for all chat-related schemas
export const chatScope = scope({
  // Helper type for text content part
  textContentPart: {
    type: "'text'",
    text: "string",
  },
  // Helper type for image/file content part
  mediaContentPart: {
    type: "'image' | 'file'",
    data: "string", // Base64
    mimeType: "string",
  },
  // Union type for content parts
  contentPart: "textContentPart | mediaContentPart",

  // Schema for tool calls
  toolCall: {
    id: "string",
    type: "'function'",
    function: {
      name: "string",
      arguments: "string", // JSON string
    },
  },
  // Schema for tool results
  toolResult: {
    tool_call_id: "string",
    result: "unknown",
  },

  // Define the structure for a single message within the scope
  message: {
    role: "'user' | 'assistant' | 'system' | 'tool'",
    // Content can be a string or an array of content parts
    content: "string | contentPart[]",
    // Optional arrays of tool calls/results using ArkType syntax
    "tool_calls?": "toolCall[]",
    "tool_results?": "toolResult[]",
  },

  // Define the schema for the overall chat request body within the scope
  chatRequest: {
    // Use 'message[]' for an array of messages
    messages: "message[]",
  },
});

export const { chatRequest: chatRequestSchema } = chatScope.export();
