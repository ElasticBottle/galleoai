"use client";

import { backend } from "@/lib/backend";
import { ThemeToggle } from "@rectangular-labs/ui/components/theme-provider";
import {
  ChatMessage,
  ChatMessageAvatar,
  ChatMessageContent,
} from "@rectangular-labs/ui/components/chat/chat-message";
import { ChatMessageArea } from "@rectangular-labs/ui/components/chat/chat-message-area";
import {
  ChatInput,
  ChatInputSubmit,
  ChatInputTextArea,
} from "@rectangular-labs/ui/components/chat/chat-input";
import { FilePreview } from "@rectangular-labs/ui/components/chat/file-preview";
import { TypingIndicator } from "@rectangular-labs/ui/components/chat/typing-indicator";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Paperclip } from "@rectangular-labs/ui/components/icon";
import { createFileRoute } from "@tanstack/react-router";
import { useChat, type Message } from "@ai-sdk/react";
import { useState, useRef } from "react";

// Define types for multimodal message content parts
type TextPart = { type: "text"; text: string };
type FilePart = {
  type: "file" | "image";
  data: string; // Base64
  mimeType: string;
};
type MessageContentPart = TextPart | FilePart;

export const Route = createFileRoute("/")({
  component: ChatInterface,
  loader: async () => {
    try {
      const response = await backend.index.$get();
      return response.json();
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      return { message: "Welcome!" }; // Default data if fetch fails
    }
  },
});

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const parts = reader.result.split(",");
        // Ensure the split resulted in at least two parts (prefix and data)
        if (parts.length >= 2 && parts[1]) {
          resolve(parts[1]); // Return the base64 part
        } else {
          reject(new Error("Invalid Data URL format"));
        }
      } else {
        reject(new Error("Failed to read file as base64 string"));
      }
    };
    reader.onerror = reject;
  });

function ChatInterface() {
  // Optional: Use loader data if you fetched something
  // const initialData = Route.useLoaderData();

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    stop,
  } = useChat({
    api: backend.api.chat.$url().href, // Ensure this matches the backend route
    // We'll handle submission manually to include files
    // Send base64 files in body under a specific key
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      // Basic validation (example: limit count or size)
      if (attachedFiles.length + newFiles.length > 5) {
        alert("You can attach a maximum of 5 files.");
        return;
      }
      setAttachedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
    // Reset file input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && attachedFiles.length === 0) return; // Need input or files

    const currentInput = input; // Capture input before clearing
    const filesToProcess = attachedFiles;

    // Clear input and files immediately for better UX
    const syntheticEvent = {
      target: { value: "" },
    } as React.ChangeEvent<HTMLTextAreaElement>; // Use correct element type
    handleInputChange(syntheticEvent);
    setAttachedFiles([]);

    // Prepare multimodal message content with defined type
    const userMessageContent: MessageContentPart[] = [];
    let userMessageText = ""; // Store text part separately for local update
    if (currentInput.trim()) {
      const textPart = { type: "text" as const, text: currentInput };
      userMessageContent.push(textPart);
      userMessageText = textPart.text;
    }

    // Process files
    for (const file of filesToProcess) {
      try {
        const base64Data = await fileToBase64(file);
        userMessageContent.push({
          type: file.type.startsWith("image/") ? "image" : "file",
          data: base64Data,
          mimeType: file.type || "application/octet-stream", // Provide default MIME type
        });
      } catch (error) {
        console.error("Error processing file:", file.name, error);
        // Optionally add an error message to the chat
      }
    }

    // Create the new user message object
    const newUserMessage: Message = {
      id: Date.now().toString(), // Temporary ID
      role: "user",
      // For local state update, useChat expects a string
      content: userMessageText,
      // We'll send the full structure in the body override
    };

    // Update messages state locally first with just the text
    const updatedMessagesForApi = [
      ...messages,
      {
        id: newUserMessage.id,
        role: newUserMessage.role,
        content: userMessageContent, // Use full content for API call body
      },
    ];
    setMessages([...messages, newUserMessage]); // Update UI with text-only content locally

    // Manually trigger the API call using handleSubmit
    // The second argument IS ChatRequestOptions, which includes body
    handleSubmit(e, {
      body: {
        // Send the message list with the *full* content structure
        messages: updatedMessagesForApi,
      },
    });
  };

  // Helper function to extract text content for display
  const getTextContent = (content: string | MessageContentPart[]): string => {
    if (typeof content === "string") {
      return content;
    }
    const textPart = content.find((part) => part.type === "text") as
      | TextPart
      | undefined;
    return textPart?.text || ""; // Return text or empty string if no text part
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <ThemeToggle className="absolute top-4 right-4 z-10" />
      <ChatMessageArea className="flex-1 p-4 pb-20">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 py-5">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              type={message.role === "user" ? "outgoing" : "incoming"}
              id={message.id}
            >
              <ChatMessageAvatar />
              <ChatMessageContent
                id={message.id}
                // Pass the actual content structure to the renamed prop
                messageContent={
                  message.content as string | MessageContentPart[]
                }
              />
              {/* TODO: Enhance ChatMessageContent to render non-text parts */}
            </ChatMessage>
          ))}
          {isLoading && (
            <ChatMessage type="incoming" id="typing">
              <ChatMessageAvatar />
              <TypingIndicator />
            </ChatMessage>
          )}
        </div>
      </ChatMessageArea>

      <div className="fixed right-0 bottom-0 left-0 flex justify-center border-t bg-background p-4 backdrop-blur-sm">
        <form onSubmit={handleFormSubmit} className="relative w-full max-w-3xl">
          {/* Hidden File Input */}
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.txt,.md" // Define acceptable types
          />

          {/* File Previews */}
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachedFiles.map((file) => (
                <FilePreview
                  key={`${file.name}-${file.lastModified}`}
                  file={file}
                  onRemove={() =>
                    removeFile(attachedFiles.findIndex((f) => f === file))
                  }
                />
              ))}
            </div>
          )}

          {/* Chat Input Area */}
          <ChatInput
            value={input}
            onChange={handleInputChange}
            loading={isLoading}
            onSubmit={handleSubmit}
            onStop={stop}
            variant="default" // Use the default styled input
          >
            {/* Attach Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute bottom-2 left-2 h-8 w-8 shrink-0 rounded-full"
              onClick={triggerFileInput}
              disabled={isLoading || attachedFiles.length >= 5}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Text Area (adjust padding for button) */}
            <ChatInputTextArea
              placeholder="Ask about Singapore trademark registration..."
              className="pr-14 pl-12" // Make space for buttons
              rows={1}
            />

            {/* Submit Button */}
            <ChatInputSubmit
              type="submit"
              className="absolute right-2 bottom-2"
            />
          </ChatInput>
        </form>
      </div>
    </div>
  );
}
