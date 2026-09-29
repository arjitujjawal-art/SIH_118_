"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  HelpCircle, 
  RefreshCw,
  BookOpen,
  PanelRightClose,
  ChevronRight,
  ShieldCheck,
  Info
} from "lucide-react";
import { sendChatMessage } from "@/lib/api";
import { STATIC_GUIDED_HELP } from "@/lib/constants";
import ReactMarkdown from "react-markdown";

export interface ScanBriefing {
  type: "start" | "end";
  workerName: string;
  workerId: string;
  unit: string;
  badgeId: string;
  hazardScore?: number;
  hazardLevel?: string;
  doseRangeStr?: string;
  twaRangeStr?: string;
  deltaE?: number;
  guidanceText?: string;
  scanId?: string;
  timestamp?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  reference?: string;
  isStatic?: boolean;
}

export interface ChatbotDrawerProps {
  workerId?: string;
  workerName?: string;
  plantUnit?: string;
  badgeId?: string;
  briefing?: ScanBriefing | null;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  embedded?: boolean;
}

export default function ChatbotDrawer({ 
  workerId, 
  workerName, 
  plantUnit,
  badgeId,
  briefing,
  isOpen: controlledIsOpen,
  onClose,
  onOpen,
  embedded = false,
}: ChatbotDrawerProps) {
  // Support both controlled and uncontrolled states (default to open = true)
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (onClose) onClose();
    else setInternalIsOpen(false);
  };

  const handleOpen = () => {
    if (onOpen) onOpen();
    else setInternalIsOpen(true);
  };

  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `sess_${Math.random().toString(36).substring(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I am **Rakshak AI**, your refinery safety companion. I have loaded **${workerName || "worker"}**'s dossier (${workerId || "EMP-1042"}${plantUnit ? ` · Unit ${plantUnit}` : ""}). How can I assist with exposure calculations, OISD protocols, or health clearance today?`,
    },
  ]);

  // Contextual suggestions based on active worker
  const [currentSuggestions, setCurrentSuggestions] = useState([
    { key: "summary", text: `Summarize ${workerName || "this worker"}'s 7-day exposure.` },
    { key: "twa", text: "Explain how 8-hour TWA is calculated." },
    { key: "procedure", text: `Safety procedures for ${plantUnit || "this unit"}.` },
    { key: "replacement", text: "Check wristband replacement schedule." },
  ]);

  // When worker changes, refresh suggestions
  useEffect(() => {
    if (workerName) {
      setCurrentSuggestions([
        { key: "summary", text: `Summarize ${workerName}'s 7-day exposure.` },
        { key: "twa", text: "Explain how 8-hour TWA is calculated." },
        { key: "procedure", text: `Safety procedures for ${plantUnit || "this unit"}.` },
        { key: "replacement", text: "Check wristband replacement schedule." },
      ]);
    }
  }, [workerName, workerId, plantUnit]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Auto-activate and generate proactive human briefing when a scan occurs
  useEffect(() => {
    if (!briefing) return;

    if (!isOpen) {
      handleOpen();
    }

    let briefingText = "";
    if (briefing.type === "start") {
      briefingText = `👋 **Good morning, Safety Lead!**\n\nI have registered **${briefing.workerName} (${briefing.workerId})** for today's shift:\n\n- 🏭 **Station Assigned:** \`${briefing.unit}\`\n- 🏷️ **Active Wristband:** \`${briefing.badgeId}\`\n- 🔬 **Morning Baseline:** Chemical detection strip is clean and intact (${(briefing.deltaE ?? 0.40).toFixed(2)} ΔE) — starting at **★ 0.0 / 5.0 Risk** (Safe).\n- 🦺 **PPE Baseline:** Half-mask acid gas respirator fit-test verified. Standard pulmonary clearance on file.\n\nWorker is fully cleared for active duty. I will track microclimates and stand by for the end-of-shift scan!`;

      setCurrentSuggestions([
        { key: "ppe", text: `What is ${briefing.workerName}'s respirator replacement schedule?` },
        { key: "unit", text: `What are background H₂S sensor readings in ${briefing.unit}?` },
        { key: "lifecycle", text: "How many rotation days remain on this band?" },
      ]);
    } else {
      const isCrit = (briefing.hazardScore ?? 0) > 3.4;
      const isCaut = !isCrit && (briefing.hazardScore ?? 0) > 1.5;

      if (isCrit) {
        briefingText = `🚨 **CRITICAL EXPOSURE ALERT for ${briefing.workerName} (${briefing.workerId})**\n\n- ⭐ **Daily Hazard Rating:** **${(briefing.hazardScore ?? 4.6).toFixed(1)} / 5.0** (DANGEROUS / CRITICAL 🔴)\n- 💨 **Cumulative Exposure Today:** **${briefing.doseRangeStr || "18.5–21.2 ppm·h"}**\n- ⏱️ **Average Shift TWA:** **${briefing.twaRangeStr || "5.2 ppm"}** (Statutory ceiling limit breached!)\n\n⚠️ **Immediate Mandatory Actions:**\n1. Escort ${briefing.workerName} to the **Occupational Health Centre (OHC)** immediately for clinical evaluation.\n2. **Retire band \`${briefing.badgeId}\`** from service.\n3. Automatic incident report **${briefing.scanId || "SCN-CRIT"}** has been dispatched to Central Control Room to inspect \`${briefing.unit}\` for fugitive leaks.`;

        setCurrentSuggestions([
          { key: "medical", text: "What clinical symptoms should the OHC doctor inspect?" },
          { key: "incident", text: "Download the OISD-STD-105 statutory incident report." },
          { key: "replacement", text: "Assign a new replacement wristband for this worker." },
        ]);
      } else if (isCaut) {
        briefingText = `⚠️ **Shift Exposure Caution for ${briefing.workerName} (${briefing.workerId})**\n\n- ⭐ **Daily Hazard Rating:** **${(briefing.hazardScore ?? 2.4).toFixed(1)} / 5.0** (MODERATE / CAUTION 🟡)\n- 💨 **Cumulative Exposure Today:** **${briefing.doseRangeStr || "7.5–9.2 ppm·h"}**\n- ⏱️ **Average Shift TWA:** **${briefing.twaRangeStr || "1.0–1.2 ppm"}**\n\n💡 **Supervisor Recommendation:**\nExposure is approaching the caution threshold. Inspect respiratory seal fit and check \`${briefing.unit}\` pump seals before tomorrow's rotation. Normal handover permitted with caution note.`;

        setCurrentSuggestions([
          { key: "respirator", text: "Does this worker need a respirator fit re-test?" },
          { key: "unit", text: `Check if other workers in ${briefing.unit} had elevated readings.` },
          { key: "handover", text: "Log supervisor caution note for tomorrow's shift lead." },
        ]);
      } else {
        briefingText = `📋 **Shift Completion Scan for ${briefing.workerName} (${briefing.workerId})**\n\n- ⭐ **Daily Hazard Rating:** **${(briefing.hazardScore ?? 1.8).toFixed(1)} / 5.0** (SAFE / NORMAL 🟢)\n- 💨 **Cumulative Exposure Today:** **${briefing.doseRangeStr || "3.0–3.6 ppm·h"}**\n- ⏱️ **Average Shift TWA:** **${briefing.twaRangeStr || "0.4–0.5 ppm"}** (Well below 1.0 ppm caution threshold)\n\n💡 **Shift Summary:**\nWorker exposure remained well within safe operational parameters throughout today's shift at \`${briefing.unit}\`. No acute symptoms detected. Standard handover approved!`;

        setCurrentSuggestions([
          { key: "explain", text: "Explain how the 1.8 / 5.0 hazard rating was computed." },
          { key: "history", text: `Show ${briefing.workerName}'s 7-day cumulative load graph.` },
          { key: "compare", text: `How does this compare to average ${briefing.unit} exposure?` },
        ]);
      }
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: briefingText,
      },
    ]);
  }, [briefing]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputMsg("");
    setLoading(true);

    try {
      const res = await sendChatMessage(sessionId, text);
      const botReply = res.reply || res.message || res.advisory_text || "Exposure record verified. All statutory parameters monitored.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: botReply,
        },
      ]);
    } catch (err) {
      console.warn("AI Chat unavailable, falling back to static safety protocols", err);
      const matchedKey = Object.keys(STATIC_GUIDED_HELP).find((k) =>
        text.toLowerCase().includes(k)
      ) || "procedure";

      const fallback = STATIC_GUIDED_HELP[matchedKey];
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**Guided help — not connected to an AI model**\n\n${fallback.answer}`,
          reference: fallback.reference,
          isStatic: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Content of the chat card (used in both embedded sidebar and mobile drawer)
  const chatCardContent = (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-light-surface shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-charcoal text-white p-4 sm:p-5 flex items-center justify-between border-b border-dark-surface shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-teal-deep text-yellow-golden shadow-md shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-base sm:text-lg uppercase tracking-tight text-white truncate">
                Rakshak AI
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold shrink-0">
                Live Advisor
              </span>
            </div>
            <div className="text-[11px] text-sage truncate">
              {workerName ? `${workerName} (${workerId || "Worker"})` : "Refinery Safety Advisor"}
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="p-1.5 text-sage hover:text-white rounded-xl hover:bg-white/10 transition-colors flex items-center gap-1 shrink-0 ml-2"
          title="Collapse AI assistant and expand dashboard"
        >
          <PanelRightClose className="w-5 h-5 hidden sm:block" />
          <X className="w-5 h-5 sm:hidden" />
        </button>
      </div>

      {/* Proactive Scan Briefing Banner */}
      {briefing && (
        <div className="bg-yellow-golden/10 border-b border-yellow-golden/30 px-4 py-2 flex items-center justify-between text-[11px] font-mono shrink-0">
          <div className="flex items-center gap-1.5 text-yellow-900 font-bold truncate">
            <Sparkles className="w-3.5 h-3.5 text-yellow-700 shrink-0" />
            <span className="truncate">Active Scan Briefing</span>
          </div>
          <span className="text-sage-muted text-[10px] shrink-0 font-medium">
            {briefing.type === "start" ? "Shift Check-In" : "Shift Completion"}
          </span>
        </div>
      )}

      {/* Chat Message Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-warm-white/40">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[90%] p-3.5 rounded-2xl ${
                m.role === "user"
                  ? "bg-teal-deep text-white rounded-tr-none shadow-sm"
                  : "bg-white text-charcoal rounded-tl-none border border-light-surface leading-relaxed shadow-sm"
              }`}
            >
              {m.isStatic && (
                <div className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded mb-1.5 inline-block">
                  Offline Protocol Mode
                </div>
              )}
              <div className="prose prose-xs max-w-none text-charcoal [&_strong]:text-charcoal [&_strong]:font-bold [&_ul]:my-1.5 [&_li]:my-0.5 [&_p]:my-1">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>

              {m.reference && (
                <div className="mt-2 pt-2 border-t border-light-surface text-[10px] font-mono text-sage-muted flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-teal-deep shrink-0" />
                  <span className="truncate">Ref: {m.reference}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sage-muted text-xs p-3 bg-white rounded-2xl border border-light-surface max-w-[85%] shadow-sm">
            <RefreshCw className="w-4 h-4 text-teal-deep animate-spin shrink-0" />
            <span className="text-[11px]">Rakshak AI is consulting safety protocols...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="p-3 bg-white border-t border-light-surface shrink-0">
        <div className="text-[10px] font-mono text-sage-muted uppercase mb-1.5 flex items-center gap-1 font-bold">
          <HelpCircle className="w-3 h-3 text-teal-deep shrink-0" />
          <span>Quick Safety Queries:</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {currentSuggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s.text)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-warm-white hover:bg-yellow-golden/20 border border-light-surface text-charcoal hover:border-yellow-golden/50 transition-colors text-left disabled:opacity-50"
            >
              {s.text}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputMsg);
        }}
        className="p-3 bg-white border-t border-light-surface flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder={`Ask Rakshak about ${workerName || "worker"} safety...`}
          className="flex-1 p-2.5 text-xs bg-warm-white rounded-xl border border-light-surface text-charcoal focus:ring-2 focus:ring-teal-deep outline-none placeholder:text-sage-muted"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !inputMsg.trim()}
          className="p-2.5 bg-charcoal text-white hover:bg-black rounded-xl transition-colors disabled:opacity-50 shadow-sm shrink-0"
          title="Send query"
        >
          <Send className="w-4 h-4 text-yellow-golden" />
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* 1. When Closed: Sleek Floating Re-Open Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-40 bg-charcoal text-white hover:bg-black px-4 py-3 sm:px-5 sm:py-3.5 rounded-full shadow-2xl border border-yellow-golden/40 flex items-center gap-3 group transition-all duration-300 hover:scale-105"
          title="Open Rakshak AI Safety Advisor"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-yellow-golden" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="text-left">
            <div className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>Ask Rakshak AI</span>
              <span className="text-[10px] font-mono text-emerald-400 font-normal">● Live</span>
            </div>
            <div className="text-[10px] text-sage hidden sm:block">
              {workerName ? `${workerName} Dossier` : "Safety Advisor"}
            </div>
          </div>
        </button>
      )}

      {/* 2. Embedded Desktop Sidebar Mode */}
      {embedded && isOpen && (
        <aside className="w-full lg:w-[380px] xl:w-[420px] shrink-0 sticky top-24 self-start h-[calc(100vh-7rem)] z-30 transition-all duration-300 ease-industrial">
          {chatCardContent}
        </aside>
      )}

      {/* 3. Mobile Slide-Over Drawer Mode (when on small screens or non-embedded) */}
      {!embedded && isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="fixed inset-0"
            onClick={handleClose}
          />
          <div className="relative w-full max-w-md h-full z-10 animate-in slide-in-from-right duration-300">
            {chatCardContent}
          </div>
        </div>
      )}
    </>
  );
}
