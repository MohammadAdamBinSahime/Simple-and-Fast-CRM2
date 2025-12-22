import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MessageCircle,
  Send,
  Plus,
  Trash2,
  Loader2,
  Bot,
  User,
  Menu,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  messages?: Message[];
}

export default function ChatPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  // Fetch selected conversation with messages
  const { data: selectedConversation, isLoading: messagesLoading } = useQuery<Conversation>({
    queryKey: ["/api/conversations", selectedConversationId],
    enabled: !!selectedConversationId,
  });

  const messages = selectedConversation?.messages || [];

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/conversations", { title: "New Chat" });
    },
    onSuccess: async (res) => {
      const newConversation = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversationId(newConversation.id);
    },
    onError: () => {
      toast({ title: "Failed to start new chat", variant: "destructive" });
    },
  });

  // Delete conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (selectedConversationId === deleteConversationMutation.variables) {
        setSelectedConversationId(null);
      }
      toast({ title: "Chat deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete chat", variant: "destructive" });
    },
  });

  // Send message with streaming
  const sendMessage = async () => {
    if (!input.trim() || !selectedConversationId || isStreaming) return;

    const messageContent = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: selectedConversationId,
      role: "user",
      content: messageContent,
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData<Conversation>(
      ["/api/conversations", selectedConversationId],
      (old) => old ? { ...old, messages: [...(old.messages || []), tempUserMessage] } : old
    );

    try {
      const response = await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                }
                if (data.done) {
                  // Refresh the conversation to get saved messages
                  queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversationId] });
                  // Also refresh the conversations list to update the title in sidebar
                  queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      toast({ title: "Failed to get AI response", variant: "destructive" });
      // Remove the optimistic user message on error
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversationId] });
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Auto-select first conversation or create one
  useEffect(() => {
    if (!conversationsLoading && conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, conversationsLoading, selectedConversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setSheetOpen(false);
  };

  const ConversationList = () => (
    <>
      <div className="p-4 border-b">
        <Button
          onClick={() => createConversationMutation.mutate()}
          disabled={createConversationMutation.isPending}
          className="w-full"
          data-testid="button-new-chat"
        >
          {createConversationMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {conversationsLoading ? (
          <div className="p-4 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No chats yet</p>
            <p className="text-xs mt-1">Start a new conversation</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer hover-elevate ${
                  selectedConversationId === conv.id ? "bg-accent" : ""
                }`}
                onClick={() => handleSelectConversation(conv.id)}
                data-testid={`conversation-${conv.id}`}
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-sm">{conv.title}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this conversation.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteConversationMutation.mutate(conv.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );

  return (
    <div className="h-full flex">
      {/* Desktop Conversation List */}
      {!isMobile && (
        <div className="w-64 border-r flex flex-col">
          <ConversationList />
        </div>
      )}

      {/* Mobile Sheet for Conversations */}
      {isMobile && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Conversations</SheetTitle>
            </SheetHeader>
            <div className="flex-1 flex flex-col overflow-hidden">
              <ConversationList />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Mobile Header */}
            {isMobile && (
              <div className="p-3 border-b flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSheetOpen(true)} data-testid="button-open-chats">
                  <Menu className="h-5 w-5" />
                </Button>
                <span className="font-medium truncate">
                  {selectedConversation?.title || "Chat"}
                </span>
              </div>
            )}
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 && !streamingContent ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Bot className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">How can I help you today?</p>
                  <p className="text-sm mt-2">Ask me anything about your CRM, contacts, or deals.</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                      <Card className={`p-3 max-w-[80%] ${message.role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </Card>
                      {message.role === "user" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {streamingContent && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </div>
                      <Card className="p-3 max-w-[80%]">
                        <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                      </Card>
                    </div>
                  )}
                  {isStreaming && !streamingContent && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </div>
                      <Card className="p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </Card>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="max-w-3xl mx-auto flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  disabled={isStreaming}
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming}
                  data-testid="button-send-message"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {isMobile && (
              <div className="p-3 border-b flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSheetOpen(true)} data-testid="button-open-chats-empty">
                  <Menu className="h-5 w-5" />
                </Button>
                <span className="font-medium">AI Assistant</span>
              </div>
            )}
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
              <Bot className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">AI Assistant</p>
              <p className="text-sm mt-2 mb-4 text-center">Your personal CRM helper</p>
              <Button onClick={() => createConversationMutation.mutate()}>
                <Plus className="h-4 w-4 mr-2" />
                Start a conversation
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
