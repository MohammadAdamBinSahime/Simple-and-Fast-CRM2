import type { Express, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { chatStorage } from "./storage";
import { db } from "../../db";
import { contacts, deals, tasks } from "@shared/schema";
import { desc } from "drizzle-orm";
import { isAuthenticated } from "../auth";

// Get user ID from session claims
function getUserId(req: Request): string | null {
  const user = req.user as any;
  return user?.claims?.sub || null;
}

// Using Gemini via Replit AI Integrations
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

// System prompt for CRM assistant
const CRM_SYSTEM_PROMPT = `You are an AI assistant for a CRM application designed for real estate agents. Your role is to help users with their customer relationship management tasks.

You can help with:
- Answering questions about contacts, companies, deals, and tasks
- Providing suggestions for follow-ups and next actions
- Offering sales tips and best practices for real estate
- Helping organize and prioritize work

Keep your responses concise, professional, and helpful. Use simple language suitable for real estate professionals.`;

export function registerChatRoutes(app: Express): void {
  // Get all conversations for the current user
  app.get("/api/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const conversations = await chatStorage.getAllConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const id = req.params.id;
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      if (conversation.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(userId, title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const id = req.params.id;
      const conversation = await chatStorage.getConversation(id);
      if (conversation && conversation.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const conversationId = req.params.id;
      const conversation = await chatStorage.getConversation(conversationId);
      
      if (!conversation || conversation.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { content } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get some CRM context to provide to the AI
      const [recentContacts, recentDeals, recentTasks] = await Promise.all([
        db.select().from(contacts).orderBy(desc(contacts.createdAt)).limit(5),
        db.select().from(deals).orderBy(desc(deals.createdAt)).limit(5),
        db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(5),
      ]);

      const crmContext = `Current CRM Summary:
- Recent contacts: ${recentContacts.map(c => `${c.firstName} ${c.lastName}`).join(", ") || "None"}
- Active deals: ${recentDeals.map(d => `${d.name} ($${d.value})`).join(", ") || "None"}
- Pending tasks: ${recentTasks.filter(t => t.completed === "false").map(t => t.title).join(", ") || "None"}`;

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      
      // Build Gemini-format messages with system instruction
      const systemInstruction = `${CRM_SYSTEM_PROMPT}\n\n${crmContext}`;
      const chatContents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from Gemini
      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: chatContents,
        config: {
          systemInstruction: systemInstruction,
          maxOutputTokens: 1024,
        },
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const text = chunk.text || "";
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      // Generate a title for new conversations (first message)
      if (messages.length === 1) {
        try {
          const titleResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: `Generate a very short title (3-5 words max) for a conversation that starts with: "${content}". Only respond with the title, no quotes or punctuation.` }] }],
          });
          const newTitle = titleResponse.text?.trim().slice(0, 50) || "Chat";
          await chatStorage.updateConversationTitle(conversationId, newTitle);
        } catch (e) {
          console.error("Error generating title:", e);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}
