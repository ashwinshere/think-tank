"use client";

import { useEffect, useState } from "react";
import { KeyRound, Sparkles, CheckCircle2, AlertCircle, X, ShieldCheck, Zap } from "lucide-react";
import { getStoredApiKey, setStoredApiKey, callAI } from "@/lib/api";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey() || "");
      setStatus("idle");
      setStatusMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSave() {
    setStoredApiKey(apiKey);
    if (!apiKey.trim()) {
      setStatus("idle");
      setStatusMsg("Using Smart Peer Mock mode (offline).");
      setTimeout(() => onClose(), 600);
      return;
    }

    setStatus("testing");
    setStatusMsg("Testing connection with Google Gemini...");

    try {
      const res = await callAI<{ ok: boolean; model: string; error?: string }>("test_connection", {});
      if (res.ok) {
        setStatus("success");
        setStatusMsg(`Connected successfully to ${res.model}! Live Gemini AI is active.`);
        setTimeout(() => onClose(), 1200);
      } else {
        setStatus("error");
        setStatusMsg(res.error || "Failed to connect with provided key. Please verify.");
      }
    } catch (err: any) {
      setStatus("error");
      setStatusMsg("Connection failed. Check your key and network.");
    }
  }

  function handleClear() {
    setApiKey("");
    setStoredApiKey("");
    setStatus("idle");
    setStatusMsg("Switched to Smart Peer Mock mode.");
    setTimeout(() => onClose(), 600);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeUp">
      <div className="bg-surface border border-line rounded-2xl max-w-md w-full p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-subink hover:text-ink p-1 rounded-full hover:bg-paper transition"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center text-accent-dark">
            <KeyRound size={20} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-ink">AI Model Settings</h3>
            <p className="text-xs text-subink">Toggle Live Gemini AI or Smart Peer Mock</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm bg-paper focus:border-accent focus:bg-white outline-none font-mono"
            />
            <p className="text-[11px] text-subink mt-1.5 flex items-center gap-1">
              Get a free API key from{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-accent-dark underline font-medium hover:text-accent"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                status === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : status === "error"
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-paper text-subink border border-line"
              }`}
            >
              {status === "success" && <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />}
              {status === "error" && <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />}
              {status === "testing" && <Zap size={15} className="text-accent shrink-0 mt-0.5 animate-pulse" />}
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-paper/60 border border-line text-xs text-subink space-y-1">
            <p className="font-semibold text-ink flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-accent-dark" /> Privacy &amp; Fallbacks
            </p>
            <p>
              Your key is saved locally in your browser session. Without a key, ThinkTank runs on the built-in <b>Smart Topic Knowledge Engine</b> with full concept breakdown and peer guidance.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handleClear}
              className="text-xs font-semibold px-3 py-2 rounded-xl text-subink hover:text-ink hover:bg-paper transition"
            >
              Use Smart Mock
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="text-xs font-semibold px-4 py-2 rounded-xl border border-line text-ink hover:bg-paper transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={status === "testing"}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-dark transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Sparkles size={13} />
                {status === "testing" ? "Connecting..." : "Save & Connect"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
