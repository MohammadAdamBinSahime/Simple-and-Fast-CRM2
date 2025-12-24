import { storage } from "../storage";
import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";

type Doc = { id: string; text: string; source: string };
type EmbeddedChunk = { text: string; metadata: { id: string; source: string }; embedding: number[] };

const userStores = new Map<string, EmbeddedChunk[]>();

function getUserId(req: Request): string | null {
  const user = req.user as any;
  return user?.claims?.sub || null;
}

async function buildDocs(userId: string): Promise<Doc[]> {
  const [contacts, companies, deals, notes, tasks] = await Promise.all([
    storage.getContacts(),
    storage.getCompanies(),
    storage.getDeals(),
    storage.getNotes(),
    storage.getTasks(),
  ]);
  const docs: Doc[] = [];
  for (const c of contacts) {
    docs.push({
      id: `contact:${c.id}`,
      text: `Contact ${c.firstName || ""} ${c.lastName || ""} email ${c.email || ""} phone ${c.phone || ""} company ${c.companyId || ""}`,
      source: "contacts",
    });
  }
  for (const co of companies) {
    docs.push({
      id: `company:${co.id}`,
      text: `Company ${co.name} domain ${co.domain || ""} industry ${co.industry || ""}`,
      source: "companies",
    });
  }
  for (const d of deals) {
    docs.push({
      id: `deal:${d.id}`,
      text: `Deal ${d.name} value ${d.value} stage ${d.stage} company ${d.companyId || ""} contact ${d.contactId || ""}`,
      source: "deals",
    });
  }
  for (const n of notes) {
    docs.push({
      id: `note:${n.id}`,
      text: `Note ${n.content}`,
      source: "notes",
    });
  }
  for (const t of tasks) {
    docs.push({
      id: `task:${t.id}`,
      text: `Task ${t.title} due ${t.dueDate || ""} completed ${t.completed}`,
      source: "tasks",
    });
  }
  return docs;
}

export async function indexUserData(userId: string): Promise<void> {
  const docs = await buildDocs(userId);
  const chunks: { text: string; metadata: { id: string; source: string } }[] = [];
  for (const d of docs) {
    const txt = d.text || "";
    let i = 0;
    const size = 800;
    const overlap = 100;
    while (i < txt.length) {
      const slice = txt.slice(i, i + size);
      chunks.push({ text: slice, metadata: { id: d.id, source: d.source } });
      i += size - overlap;
    }
  }
  const vectors: number[][] = await embedMany(chunks.map(c => c.text));
  const embedded: EmbeddedChunk[] = chunks.map((c, idx) => ({ text: c.text, metadata: c.metadata, embedding: vectors[idx] }));
  userStores.set(userId, embedded);
}

export async function queryRag(userId: string, question: string): Promise<{ answer: string; sources: { id: string; source: string; text: string }[] }> {
  let store = userStores.get(userId);
  if (!store || store.length === 0) {
    await indexUserData(userId);
    store = userStores.get(userId)!;
  }
  const qVec = await embedOne(question);
  const scored = store
    .map(ch => ({ ch, score: cosine(ch.embedding, qVec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.ch);
  const context = scored.map(r => r.text).join("\n\n");
  const completionText = await answerWithLLMOrFallback(context, question);
  const sources = scored.map(r => ({
    id: r.metadata.id,
    source: r.metadata.source,
    text: r.text,
  }));
  return { answer: completionText, sources };
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export function registerRagRoutes(app: Express): void {
  app.post("/api/ai/rag/reindex", isAuthenticated, async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    await indexUserData(userId);
    res.json({ ok: true });
  });
  app.post("/api/ai/rag/query", isAuthenticated, async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { question } = req.body || {};
    if (!question) return res.status(400).json({ error: "Missing question" });
    const result = await queryRag(userId, question);
    res.json(result);
  });
}

async function embedMany(texts: string[]): Promise<number[][]> {
  if (process.env.OPENAI_API_KEY) {
    const embeddings = new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY });
    return embeddings.embedDocuments(texts);
  }
  return texts.map(embedLocal);
}

async function embedOne(text: string): Promise<number[]> {
  if (process.env.OPENAI_API_KEY) {
    const embeddings = new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY });
    return embeddings.embedQuery(text);
  }
  return embedLocal(text);
}

function embedLocal(text: string): number[] {
  const n = 256;
  const v = new Array(n).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    v[code % n] += 1;
  }
  return v.map(x => x / (text.length || 1));
}

async function answerWithLLMOrFallback(context: string, question: string): Promise<string> {
  if (process.env.OPENAI_API_KEY) {
    const llm = new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY, model: "gpt-4o-mini" });
    const prompt = `Use the context to answer the user's question.\nContext:\n${context}\nQuestion:\n${question}\nAnswer concisely.`;
    const completion = await llm.invoke([{ role: "user", content: prompt }]);
    const txt = (completion as any).content?.[0]?.text || (completion as any).content || "";
    return typeof txt === "string" ? txt : JSON.stringify(txt);
  }
  const snippet = context.slice(0, 600);
  return `Based on the available context:\n${snippet}\n\nAnswer: ${question}`;
}
