"use client";
import React, { JSX, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";

type Role = "user" | "bot";
interface Message {
  id: string;
  role: Role;
  text: string;
  time: number;
}

const uid = (prefix = "m") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export default function Chatbot(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid("bot"),
      role: "bot",
      text: "Hello! I'm your AI Buddy. Ask me anything!",
      time: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function geminiReply(userText: string): Promise<string> {
    const API_KEY =
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "AIzaSyAy4kq_sqh4gua9z2uEJaurOo06nlxleOg";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    const body = {
      contents: [{ parts: [{ text: userText }] }],
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "(No response from Gemini)"
      );
    } catch (err) {
      console.error(err);
      return "Sorry, I couldn't reach the Gemini API.";
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMessage: Message = {
      id: uid("u"),
      role: "user",
      text: text.trim(),
      time: Date.now(),
    };
    setMessages((m) => [...m, userMessage]);
    setInput("");
    setIsSending(true);

    const botReply: Message = {
      id: uid("b"),
      role: "bot",
      text: await geminiReply(userMessage.text),
      time: Date.now(),
    };

    setMessages((m) => [...m, botReply]);
    setIsSending(false);
  };

  const onSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (isSending) return;
    sendMessage(input);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-pink-50 to-indigo-50">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/logo192.png" alt="bot" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">Teddy AI Buddy</CardTitle>
              <p className="text-sm text-muted-foreground">
                Powered by Google Gemini
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-sm text-muted-foreground">
            Online
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex flex-col h-[60vh] sm:h-[70vh]">
            <ScrollArea className="flex-1 p-4" style={{ overflow: "auto" }}>
              <div ref={scrollRef} className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 items-start ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "bot" && (
                      <div className="flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium">
                          🤖
                        </div>
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] md:max-w-[70%] px-4 py-2 rounded-lg break-words text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-white border"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      <div className="text-[10px] text-muted-foreground mt-1 text-right">
                        {new Date(msg.time).toLocaleTimeString()}
                      </div>
                    </div>

                    {msg.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-medium">
                          U
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <form
              onSubmit={onSubmit}
              className="border-t p-3 bg-gray-50 flex gap-2 items-end"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isSending ? "Waiting for reply..." : "Type a message and press Enter"
                }
                disabled={isSending}
                aria-label="Message"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
              />

              <Button
                type="submit"
                disabled={isSending || !input.trim()}
                className="flex items-center gap-2"
              >
                <Send size={16} />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
