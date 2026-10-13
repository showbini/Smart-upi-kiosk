import { useState } from "react";
import { ASSISTANT_QA } from "@/lib/sfap/data";
import { useSfap, speak } from "@/lib/sfap/store";
import { KioskButton, Panel } from "./kiosk-ui";
import { Bot, Mic, User, Volume2 } from "lucide-react";

type Msg = { role: "user" | "bot"; text: string };

const FALLBACK =
  "I can help with withdrawals, deposits, balance, bills, recharge, currency exchange and finding kiosks. Try one of the suggested questions below. (Demo assistant — no real financial advice.)";

function answer(q: string) {
  const lower = q.toLowerCase();
  const hit = ASSISTANT_QA.find((item) =>
    item.q
      .toLowerCase()
      .replace(/[^a-z ]/g, "")
      .split(" ")
      .filter((w) => w.length > 4)
      .some((w) => lower.includes(w)),
  );
  return hit?.a ?? FALLBACK;
}

export function Assistant() {
  const { a11y } = useSfap();
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Namaste! I am the SFAP Assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    const reply = answer(text);
    setMsgs((m) => [...m, { role: "user", text }, { role: "bot", text: reply }]);
    setInput("");
    speak(reply, a11y.voice);
  };

  return (
    <Panel className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Bot className="size-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-2xl font-bold">SFAP Assistant</h2>
          <p className="text-sm text-muted-foreground">
            Demo assistant — predefined answers only, no financial advice.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse text-right" : ""}`}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              {m.role === "user" ? <User className="size-4" aria-hidden /> : <Bot className="size-4" aria-hidden />}
            </span>
            <p
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-base ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {ASSISTANT_QA.map((item) => (
          <button
            key={item.q}
            type="button"
            onClick={() => send(item.q)}
            className="min-h-11 rounded-full border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
          >
            {item.q}
          </button>
        ))}
      </div>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="assistant-input" className="sr-only">
          Ask the SFAP Assistant
        </label>
        <input
          id="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          className="min-h-14 flex-1 rounded-xl border border-input bg-card px-4 text-lg placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
        />
        <KioskButton
          variant="secondary"
          ariaLabel="Voice input (simulated)"
          onClick={() => send("What services are available?")}
        >
          <Mic className="size-5" aria-hidden />
        </KioskButton>
        <KioskButton
          variant="secondary"
          ariaLabel="Read last answer aloud (simulated)"
          onClick={() => speak(msgs[msgs.length - 1]?.text ?? "", true)}
        >
          <Volume2 className="size-5" aria-hidden />
        </KioskButton>
        <KioskButton>Ask</KioskButton>
      </form>
    </Panel>
  );
}
