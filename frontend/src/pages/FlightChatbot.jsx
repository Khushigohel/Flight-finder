import { useState } from "react";
import { Send, Mic, X } from "lucide-react";

export default function FlightChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hi! I can help you find the cheapest flights ✈️" }
  ]);
  const [input, setInput] = useState("");

  const quickActions = [
    "Delhi → Goa under ₹5000",
    "Weekend trips 🔥",
    "International deals 🌍",
    "Cheapest flights today"
  ];

  const sendMessage = (text) => {
    if (!text.trim()) return;

    setMessages((prev) => [
      ...prev,
      { type: "user", text },
      { type: "bot", text: "Checking best flight deals for you..." }
    ]);

    setInput("");
  };

  return (
    <>
      {/* ✅ FLOATING BUTTON (always visible) */}
      {!open && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 9999
          }}
        >
          <button
            onClick={() => setOpen(true)}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "15px 18px",
              borderRadius: "999px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
              border: "none",
              cursor: "pointer"
            }}
          >
            🤖 Ask Ai
          </button>
        </div>
      )}

      {/* ✅ CHAT WINDOW */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "320px",
            height: "480px",
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "#2563eb",
              color: "white",
              padding: "10px",
              display: "flex",
              justifyContent: "space-between"
            }}
          >
            <span>🤖 Flight Assistant</span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "white" }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: "10px",
              overflowY: "auto",
              background: "#f9fafb"
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  maxWidth: "75%",
                  marginBottom: "8px",
                  padding: "8px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  background:
                    msg.type === "bot" ? "#e5e7eb" : "#2563eb",
                  color: msg.type === "bot" ? "black" : "white",
                  marginLeft: msg.type === "user" ? "auto" : "0"
                }}
              >
                {msg.text}
              </div>
            ))}

            {/* Quick Actions */}
            <div style={{ marginTop: "10px" }}>
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(action)}
                  style={{
                    fontSize: "12px",
                    margin: "4px",
                    padding: "6px 10px",
                    borderRadius: "20px",
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: "pointer"
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div
            style={{
              padding: "8px",
              borderTop: "1px solid #eee",
              display: "flex",
              gap: "6px"
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Try: Delhi to Goa under ₹4000"
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "20px",
                border: "1px solid #ddd",
                outline: "none"
              }}
            />

            <button style={{ background: "none", border: "none" }}>
              <Mic size={18} />
            </button>

            <button
              onClick={() => sendMessage(input)}
              style={{
                background: "#2563eb",
                // color: "white",
                border: "none",
                borderRadius: "50%",
                color: "#111827",
                padding: "8px",
                cursor: "pointer"
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}