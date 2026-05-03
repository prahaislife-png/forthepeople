"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    setSent(true);
    setMessage("");
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-accent hover:bg-accent/90 text-white rounded-full shadow-xl shadow-accent/30 flex items-center justify-center transition-all hover:scale-105"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-[fadeInUp_0.2s_ease-out]">
          <div className="bg-accent text-white px-4 py-3">
            <h3 className="font-bold text-sm">Move Prague Support</h3>
            <p className="text-[11px] text-white/70">We usually respond within a few hours</p>
          </div>
          <div className="p-4 min-h-[200px] flex flex-col">
            {sent ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <MessageCircle size={18} className="text-accent" />
                </div>
                <p className="text-sm font-semibold text-foreground">Message sent!</p>
                <p className="text-xs text-muted-foreground">We'll get back to you via email shortly.</p>
                <button onClick={() => setSent(false)} className="mt-2 text-xs text-accent hover:underline">Send another message</button>
              </div>
            ) : (
              <>
                <div className="flex-1 mb-3">
                  <div className="bg-secondary rounded-lg p-3 text-xs text-foreground mb-2">
                    Hi! 👋 Have questions about our reports or need help choosing a district? Ask us anything.
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type your question..."
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className="w-9 h-9 bg-accent hover:bg-accent/90 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">Or email us at hello@moveprague.cz</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
