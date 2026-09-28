"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Code2,
  Sparkles,
  Play,
  RotateCcw,
  ClipboardPaste,
  Trash2,
  Lightbulb,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  HelpCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  Flame,
  Layers,
  ArrowRight,
  BookOpen,
  Check,
  Cpu,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Pause,
  Copy,
  ExternalLink,
  History,
  Clock,
  Plus,
  Search,
  Cloud,
  X,
  FileCode,
} from "lucide-react";
import { Card, SectionHeader } from "./ui/Card";
import {
  SupportedLanguage,
  CodeExplanationResult,
  CodeSolutionFeedback,
  NextChallengeItem,
  CodeSessionDetail,
} from "@/lib/types";
import { getStoredApiKey } from "@/lib/api";
import {
  getDifficultyProgression,
  simulateCodeOutput,
  explainSingleLine,
  simulateStudentSolutionOutput,
  mockCodeEvaluation,
} from "@/lib/mockCodeExplainer";
import { useCodeSessions } from "@/lib/CodeSessionContext";
import { useAuth } from "@/lib/AuthContext";

const LANGUAGES: SupportedLanguage[] = [
  "Python",
  "C",
  "C++",
  "Java",
  "JavaScript",
  "HTML",
  "CSS",
  "SQL",
];

const CODE_EXAMPLES: Record<SupportedLanguage, { label: string; code: string }> = {
  Python: {
    label: "Input & Conditionals",
    code: `name = input("Enter your name: ")
age = int(input("Enter your age: "))

print(f"\\nHello {name}!")
if age >= 18:
    print("You are an adult.")
else:
    print("You are a minor.")`,
  },
  JavaScript: {
    label: "Array Filter & Map",
    code: `const scores = [45, 82, 91, 60, 77];

const passingScores = scores
  .filter(score => score >= 60)
  .map(score => score + 5);

console.log("Boosted scores:", passingScores);`,
  },
  C: {
    label: "Pointers & Memory",
    code: `#include <stdio.h>

int main() {
    int arr[3] = {10, 20, 30};
    int *ptr = arr;
    
    for (int i = 0; i < 3; i++) {
        printf("Value at %p = %d\\n", (void*)(ptr + i), *(ptr + i));
    }
    return 0;
}`,
  },
  "C++": {
    label: "Vector & Sum",
    code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> nums = {2, 4, 6, 8};
    int sum = 0;
    for (int n : nums) {
        sum += n;
    }
    cout << "Total Sum: " << sum << endl;
    return 0;
}`,
  },
  Java: {
    label: "Class & OOP",
    code: `public class Counter {
    private int count = 0;
    
    public void increment() {
        this.count += 1;
    }
    
    public static void main(String[] args) {
        Counter c = new Counter();
        c.increment();
        System.out.println("Count is: " + c.count);
    }
}`,
  },
  HTML: {
    label: "Semantic Card",
    code: `<article class="profile-card">
  <header>
    <h2>Student Profile</h2>
  </header>
  <main>
    <p>Status: Actively Learning</p>
    <button type="button">Connect</button>
  </main>
</article>`,
  },
  CSS: {
    label: "Flexbox Layout",
    code: `.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
}`,
  },
  SQL: {
    label: "Group By & Count",
    code: `SELECT department, COUNT(employee_id) AS total_staff
FROM employees
WHERE status = 'Active'
GROUP BY department
HAVING COUNT(employee_id) > 2;`,
  },
};

export function CodeLearning() {
  const { user } = useAuth();
  const {
    codeSessions,
    activeCodeSessionId,
    saveCodeSession,
    loadCodeSessionById,
    deleteCodeSession,
    startNewCodeSession,
    newSessionSignal,
    loading: sessionsLoading,
  } = useCodeSessions();

  const [language, setLanguage] = useState<SupportedLanguage | "Auto Detect">("Python");
  const [code, setCode] = useState(CODE_EXAMPLES.Python.code);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [explanation, setExplanation] = useState<CodeExplanationResult | null>(null);

  // History Modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLangFilter, setHistoryLangFilter] = useState<string>("All");
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Console Output state
  const [output, setOutput] = useState<string>("");
  const [outputStatus, setOutputStatus] = useState<"idle" | "running" | "success" | "cleared">("idle");

  // Line selection & navigation state
  const [selectedLineNumber, setSelectedLineNumber] = useState<number>(1);
  const [isPlayingSteps, setIsPlayingSteps] = useState(false);
  const [activeTab, setActiveTab] = useState<"steps" | "flow" | "concepts" | "mistakes">("steps");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Practice & Solution submission state
  const [studentCode, setStudentCode] = useState("");
  const [studentOutput, setStudentOutput] = useState<string>("");
  const [studentOutputStatus, setStudentOutputStatus] = useState<"idle" | "running" | "matched" | "mismatched" | "error">("idle");
  const [testingSolution, setTestingSolution] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<CodeSolutionFeedback | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [copiedExpectedOutput, setCopiedExpectedOutput] = useState(false);
  const [copiedStudentOutput, setCopiedStudentOutput] = useState(false);

  // Difficulty progression state
  const [activeChallengeLevel, setActiveChallengeLevel] = useState<1 | 2 | 3>(1);
  const [challenges, setChallenges] = useState<NextChallengeItem[]>([]);
  const [copiedOutput, setCopiedOutput] = useState(false);

  // Track session load from activeCodeSessionId
  useEffect(() => {
    let isMounted = true;
    if (!activeCodeSessionId) return;

    const fetchSession = async () => {
      const sess = await loadCodeSessionById(activeCodeSessionId);
      if (sess && isMounted) {
        setCode(sess.code || "");
        setLanguage((sess.language as SupportedLanguage) || "Python");
        setExplanation(sess.explanation || null);
        setOutput(sess.output || "");
        setOutputStatus(sess.output ? "success" : "idle");
        setStudentCode(sess.studentCode || "");
        setStudentOutput(sess.studentOutput || "");
        setStudentOutputStatus(sess.isCorrect ? "matched" : sess.studentOutput ? "mismatched" : "idle");
        setFeedback(sess.feedback || null);
        setSelectedLineNumber(1);
        setShowSolution(false);
        setShowHints(false);

        if (sess.explanation?.concept?.title) {
          const prog = getDifficultyProgression(sess.explanation.concept.title, sess.explanation.language);
          setChallenges(prog);
        }
        setLastSavedTime(new Date(sess.updatedAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      }
    };

    fetchSession();
    return () => {
      isMounted = false;
    };
  }, [activeCodeSessionId, loadCodeSessionById]);

  // Handle new session signal (reset to clean state)
  useEffect(() => {
    if (newSessionSignal > 0) {
      setLanguage("Python");
      setCode(CODE_EXAMPLES.Python.code);
      setExplanation(null);
      setOutput("");
      setOutputStatus("idle");
      setStudentCode("");
      setStudentOutput("");
      setStudentOutputStatus("idle");
      setFeedback(null);
      setSelectedLineNumber(1);
      setShowSolution(false);
      setShowHints(false);
      setLastSavedTime(null);
    }
  }, [newSessionSignal]);

  const codeLines = code ? code.split("\n") : [""];
  const totalLines = Math.max(1, codeLines.length);
  const safeSelectedLine = Math.min(Math.max(1, selectedLineNumber), totalLines);
  const currentLineCode = codeLines[safeSelectedLine - 1] ?? "";

  // Automatically derive the explanation for the currently selected line
  const activeLineExplanation = useMemo(() => {
    if (!explanation) return null;
    const match = explanation.line_by_line.find((item) => item.line === safeSelectedLine);
    if (match) return match;
    return explainSingleLine(currentLineCode, safeSelectedLine, explanation.language || language);
  }, [explanation, safeSelectedLine, currentLineCode, language]);

  // Auto-play steps timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingSteps) {
      timer = setInterval(() => {
        setSelectedLineNumber((prev) => {
          if (prev >= totalLines) {
            setIsPlayingSteps(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2400);
    }
    return () => clearInterval(timer);
  }, [isPlayingSteps, totalLines]);

  const handleSelectLine = (lineNum: number) => {
    setSelectedLineNumber(lineNum);
    setIsPlayingSteps(false);
  };

  const handleCodeCursor = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const textBefore = target.value.slice(0, target.selectionStart);
    const lineNum = textBefore.split("\n").length;
    setSelectedLineNumber(lineNum);
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) setCode(text);
      }
    } catch {
      // Ignore clipboard read error
    }
  };

  const handleLoadExample = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setCode(CODE_EXAMPLES[lang].code);
    setExplanation(null);
    setFeedback(null);
    setOutput("");
    setOutputStatus("idle");
    setStudentCode("");
    setShowSolution(false);
    setSelectedLineNumber(1);
    setLastSavedTime(null);
  };

  const handleRunCode = () => {
    if (!code.trim()) return;
    setRunning(true);
    setOutputStatus("running");

    setTimeout(() => {
      const simulated = simulateCodeOutput(code, language);
      setOutput(simulated);
      setOutputStatus("success");
      setRunning(false);
    }, 450);
  };

  const handleExplainCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setFeedback(null);
    setStudentCode("");
    setShowSolution(false);
    setShowHints(false);
    setSelectedLineNumber(1);
    setOutputStatus("running");

    try {
      const apiKey = getStoredApiKey();
      const res = await fetch("/api/code-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "explain",
          code,
          language,
          apiKey,
        }),
      });

      if (!res.ok) throw new Error("Failed to explain code");
      const data: CodeExplanationResult = await res.json();
      setExplanation(data);

      // Set output from AI or simulation
      const programOut = data.program_output || simulateCodeOutput(code, data.language || language);
      setOutput(programOut);
      setOutputStatus("success");

      // Preload next challenges
      const prog = getDifficultyProgression(data.concept.title, data.language);
      setChallenges(prog);
      setActiveChallengeLevel(1);

      // Auto-save session to Firebase Firestore if logged in
      if (user) {
        setIsSavingSession(true);
        const resolvedLang = (data.language as SupportedLanguage) || (language === "Auto Detect" ? "Python" : language);
        const sessionTitle = `${resolvedLang}: ${data.concept.title || "Code Learning"}`;
        await saveCodeSession({
          id: activeCodeSessionId || undefined,
          title: sessionTitle,
          language: resolvedLang,
          code,
          explanation: data,
          output: programOut,
          studentCode: "",
          studentOutput: "",
          feedback: null,
          isCorrect: false,
        });
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        setIsSavingSession(false);
      }
    } catch (err) {
      console.error("Error explaining code:", err);
      const fallbackOut = simulateCodeOutput(code, language);
      setOutput(fallbackOut);
      setOutputStatus("success");
    } finally {
      setLoading(false);
    }
  };

  const handleRunStudentCode = () => {
    if (!studentCode.trim() || !explanation) return;
    setTestingSolution(true);
    setStudentOutputStatus("running");

    const expected = explanation.practice_task.expected_output || "2\n4\n6\n8\n10";
    setTimeout(() => {
      const res = simulateStudentSolutionOutput(studentCode, explanation.language, expected);
      setStudentOutput(res.output);
      if (res.hasError) {
        setStudentOutputStatus("error");
      } else if (res.isMatch) {
        setStudentOutputStatus("matched");
      } else {
        setStudentOutputStatus("mismatched");
      }

      // Automatically construct feedback on manual test run if not submitted yet
      if (!feedback) {
        const generatedFeedback = mockCodeEvaluation(
          studentCode,
          explanation.practice_task.description,
          explanation.language,
          expected
        );
        setFeedback(generatedFeedback);
      }
      setTestingSolution(false);
    }, 400);
  };

  const handleSubmitSolution = async () => {
    if (!studentCode.trim() || !explanation) return;
    setEvaluating(true);
    setStudentOutputStatus("running");

    const expected = explanation.practice_task.expected_output || "2\n4\n6\n8\n10";

    try {
      const apiKey = getStoredApiKey();
      const res = await fetch("/api/code-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          student_code: studentCode,
          task_description: explanation.practice_task.description,
          original_concept: explanation.concept.title,
          language: explanation.language,
          apiKey,
        }),
      });

      if (!res.ok) throw new Error("Failed to evaluate code");
      const data: CodeSolutionFeedback = await res.json();
      setFeedback(data);

      const actual =
        data.actual_output ||
        simulateStudentSolutionOutput(studentCode, explanation.language, expected).output;
      setStudentOutput(actual);

      if (data.is_correct) {
        setStudentOutputStatus("matched");
      } else if (actual.toLowerCase().includes("error")) {
        setStudentOutputStatus("error");
      } else {
        setStudentOutputStatus("mismatched");
      }

      // Persist student practice progress to Firestore
      if (user && activeCodeSessionId) {
        setIsSavingSession(true);
        await saveCodeSession({
          id: activeCodeSessionId,
          studentCode,
          studentOutput: actual,
          feedback: data,
          isCorrect: data.is_correct,
        });
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        setIsSavingSession(false);
      }
    } catch (err) {
      console.error("Error evaluating solution:", err);
      const fallback = mockCodeEvaluation(
        studentCode,
        explanation.practice_task.description,
        explanation.language,
        expected
      );
      setFeedback(fallback);
      setStudentOutput(fallback.actual_output || "");
      if (fallback.is_correct) {
        setStudentOutputStatus("matched");
      } else if (fallback.actual_output?.toLowerCase().includes("error")) {
        setStudentOutputStatus("error");
      } else {
        setStudentOutputStatus("mismatched");
      }
    } finally {
      setEvaluating(false);
    }
  };

  const handleSelectChallenge = (item: NextChallengeItem) => {
    setActiveChallengeLevel(item.level);
    setStudentCode("");
    setStudentOutput("");
    setStudentOutputStatus("idle");
    setFeedback(null);
    setShowSolution(false);
    setShowHints(false);

    if (explanation) {
      setExplanation({
        ...explanation,
        practice_task: {
          title: item.title,
          description: item.description,
          difficulty: item.level === 1 ? "Beginner" : item.level === 2 ? "Easy" : "Intermediate",
          concepts: [explanation.concept.title, `Level ${item.level} Challenge`],
          hints: item.hints,
          expected_output: item.expected_output || (item.level === 1 ? "5\n4\n3\n2\n1\nBlastoff!" : item.level === 2 ? "Total sum: 15" : "Sum: 63"),
          reference_solution: item.reference_solution,
        },
      });
    }
  };

  const handleCopyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  // Filtered sessions for the history dialog
  const filteredSessions = useMemo(() => {
    return codeSessions.filter((s) => {
      const matchesSearch =
        !historySearch ||
        s.title.toLowerCase().includes(historySearch.toLowerCase()) ||
        s.language.toLowerCase().includes(historySearch.toLowerCase());
      const matchesLang =
        historyLangFilter === "All" ||
        s.language.toLowerCase() === historyLangFilter.toLowerCase();
      return matchesSearch && matchesLang;
    });
  }, [codeSessions, historySearch, historyLangFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeUp">
      {/* Header with Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <SectionHeader
          eyebrow="Interactive AI Code Explainer &amp; Practice"
          title="Code Learning Mode"
          description="Paste any code snippet to explore line-by-line step explanations beside your code console, inspect terminal outputs, and build deep programming understanding."
        />

        {/* Action Controls: New Code, History, Cloud Sync Status */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          {/* Cloud Sync Status Indicator */}
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-surface/80 text-xs text-subink font-medium shadow-sm">
              {isSavingSession ? (
                <>
                  <Loader2 size={13} className="animate-spin text-accent-dark" />
                  <span className="text-accent-dark">Syncing...</span>
                </>
              ) : lastSavedTime ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Saved at {lastSavedTime}</span>
                </>
              ) : (
                <>
                  <Cloud size={14} className="text-subink" />
                  <span>Cloud Sync Ready</span>
                </>
              )}
            </div>
          )}

          {/* History Drawer Trigger Button */}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-paper hover:border-line/80 text-xs font-semibold text-ink transition shadow-sm"
          >
            <History size={15} className="text-accent-dark" />
            <span>History</span>
            {codeSessions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-accent-light text-[10px] font-bold text-accent-dark">
                {codeSessions.length}
              </span>
            )}
          </button>

          {/* New Code Button */}
          <button
            type="button"
            onClick={() => {
              startNewCodeSession();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <Plus size={15} />
            <span>New Code</span>
          </button>
        </div>
      </div>

      {/* ================= HISTORY MODAL ================= */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent-light text-accent-dark flex items-center justify-center">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Code Learning History</h3>
                  <p className="text-xs text-subink">
                    {user ? `${codeSessions.length} sessions saved to Firebase` : "Sign in to save and sync history"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-subink hover:text-ink hover:bg-paper transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search & Language Filter Bar */}
            <div className="p-4 border-b border-line bg-paper/50 space-y-3">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subink" />
                <input
                  type="text"
                  placeholder="Search previous code lessons, concepts, or languages..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-line bg-surface text-xs font-medium text-ink focus:outline-none focus:border-accent"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {["All", ...LANGUAGES].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setHistoryLangFilter(lang)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 ${
                      historyLangFilter === lang
                        ? "bg-accent text-white shadow-sm"
                        : "bg-surface border border-line text-subink hover:text-ink"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* History Sessions List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {sessionsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-subink gap-2">
                  <Loader2 size={24} className="animate-spin text-accent-dark" />
                  <span className="text-xs font-medium">Loading your code sessions...</span>
                </div>
              ) : !user ? (
                <div className="py-12 px-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertTriangle size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-ink">Sign in to enable Cloud History</h4>
                  <p className="text-xs text-subink max-w-sm mx-auto">
                    Log in with your account to automatically save your code explanations, line-by-line notes, and practice tasks in Firebase.
                  </p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-paper text-subink flex items-center justify-center mx-auto">
                    <FileCode size={24} />
                  </div>
                  <h4 className="text-sm font-semibold text-ink">No sessions found</h4>
                  <p className="text-xs text-subink">
                    {historySearch || historyLangFilter !== "All"
                      ? "Try clearing your search query or filters."
                      : "Explain any code to automatically save it in your history."}
                  </p>
                </div>
              ) : (
                filteredSessions.map((sess) => {
                  const isActive = activeCodeSessionId === sess.id;
                  const formattedDate = new Date(sess.updatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={sess.id}
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 group ${
                        isActive
                          ? "border-accent bg-accent-light/30 shadow-sm"
                          : "border-line bg-surface hover:bg-paper hover:border-line/80"
                      }`}
                    >
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          loadCodeSessionById(sess.id);
                          setIsHistoryModalOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-200">
                            {sess.language}
                          </span>
                          <h4 className="text-xs font-bold text-ink truncate group-hover:text-accent-dark transition">
                            {sess.title}
                          </h4>
                          {sess.isCorrect && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 size={11} /> Solved
                            </span>
                          )}
                        </div>

                        {sess.codeSnippet && (
                          <pre className="text-[11px] font-mono text-subink truncate bg-paper/80 px-2 py-1 rounded-lg border border-line/60">
                            {sess.codeSnippet}
                          </pre>
                        )}

                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-subink">
                          <Clock size={11} />
                          <span>{formattedDate}</span>
                          {isActive && (
                            <span className="text-accent-dark font-bold ml-1">• Active Session</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            loadCodeSessionById(sess.id);
                            setIsHistoryModalOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition shadow-sm"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCodeSession(sess.id);
                          }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-subink hover:text-rose-500 hover:bg-rose-50 transition"
                          title="Delete session"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-line bg-paper/80 text-xs text-subink">
              <span>{filteredSessions.length} sessions listed</span>
              <button
                type="button"
                onClick={() => {
                  startNewCodeSession();
                  setIsHistoryModalOpen(false);
                }}
                className="text-xs font-semibold text-accent-dark hover:underline flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Start New Blank Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dual-Pane Section: Left = Code + Output Console, Right = Step-by-Step Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: Code Console & Separate Output Console (7 Cols) ================= */}
        <div className="lg:col-span-7 space-y-5">
          {/* Code Console Card */}
          <Card className="p-4 sm:p-6 bg-surface/95 border-line/90 shadow-lg">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-line">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-accent-light text-accent-dark flex items-center justify-center">
                  <Code2 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink">Source Code Console</h2>
                  <p className="text-[11px] text-subink font-medium">
                    {explanation ? (
                      <span>
                        Active Line: <strong className="text-accent-dark">#{safeSelectedLine}</strong>
                        {currentLineCode.trim() ? ` → ${currentLineCode.trim().slice(0, 26)}` : ""}
                      </span>
                    ) : (
                      "Paste code or pick a template"
                    )}
                  </p>
                </div>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-subink font-medium">Language:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-line bg-paper text-xs font-semibold text-ink focus:outline-none focus:border-accent shadow-sm"
                >
                  <option value="Auto Detect">⚡ Auto Detect</option>
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Example Presets */}
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              <span className="text-[11px] font-semibold text-subink mr-1">Templates:</span>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLoadExample(lang)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium transition ${
                    language === lang
                      ? "bg-accent text-white shadow-sm"
                      : "bg-paper text-subink hover:bg-line hover:text-ink"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Code Console Window with Active Line Tracking */}
            <div className="relative rounded-2xl border border-line bg-[#1e2430] text-slate-100 font-mono text-xs sm:text-sm overflow-hidden shadow-inner focus-within:border-accent">
              <div className="flex items-center justify-between px-4 py-2 bg-[#171c26] border-b border-slate-700/60 text-slate-400 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-sans font-medium text-[11px] text-slate-300">
                    {language === "Auto Detect" ? "code_editor" : `${language.toLowerCase()}_source`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-700/60 text-slate-300 transition text-[11px]"
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste size={12} />
                    <span>Paste</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCode("")}
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-700/60 text-slate-300 transition text-[11px]"
                    title="Clear code"
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="flex p-3 sm:p-4 min-h-[220px] max-h-[380px] overflow-auto relative">
                {/* Line Numbers with active marker and click handlers */}
                <div className="select-none text-slate-500 text-right pr-3 sm:pr-4 border-r border-slate-700/60 space-y-0.5 leading-6 text-xs sm:text-sm shrink-0">
                  {codeLines.map((_, idx) => {
                    const lineNum = idx + 1;
                    const isActive = safeSelectedLine === lineNum;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectLine(lineNum)}
                        className={`w-full text-right transition-colors duration-150 px-1.5 rounded cursor-pointer block ${
                          isActive
                            ? "bg-accent text-white font-bold shadow-sm"
                            : "hover:text-slate-200 hover:bg-slate-700/50"
                        }`}
                        title={`Click to explain Line ${lineNum}`}
                      >
                        {lineNum}
                      </button>
                    );
                  })}
                </div>

                {/* Editable code text area with cursor sync */}
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onClick={handleCodeCursor}
                  onKeyUp={handleCodeCursor}
                  onSelect={handleCodeCursor}
                  placeholder="Paste or write your code here..."
                  rows={Math.max(8, codeLines.length + 2)}
                  className="w-full bg-transparent text-slate-100 pl-3 sm:pl-4 focus:outline-none resize-none leading-6 font-mono text-xs sm:text-sm whitespace-pre"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-line/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={running || !code.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-paper hover:bg-line border border-line text-ink font-semibold text-xs transition shadow-sm disabled:opacity-50"
                  title="Execute and view output in terminal console"
                >
                  {running ? (
                    <Loader2 size={14} className="animate-spin text-accent" />
                  ) : (
                    <Play size={14} className="text-emerald-600 fill-emerald-600" />
                  )}
                  <span>Run Code</span>
                </button>
              </div>

              <button
                onClick={handleExplainCode}
                disabled={loading || !code.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs sm:text-sm hover:bg-accent-dark transition shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Analyzing &amp; Explaining...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Explain Code Step by Step</span>
                  </>
                )}
              </button>
            </div>
          </Card>

          {/* ================= SEPARATE OUTPUT CONSOLE ================= */}
          <Card className="p-4 sm:p-5 bg-[#171c26] border-slate-700/80 shadow-xl text-slate-100 overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/60 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="flex items-center gap-1.5 ml-2 text-slate-300 font-semibold">
                  <Terminal size={14} className="text-accent" />
                  <span>Output Console</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    outputStatus === "success"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : outputStatus === "running"
                      ? "bg-amber-950 text-amber-400 border border-amber-800"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {outputStatus === "running"
                    ? "Executing..."
                    : outputStatus === "success"
                    ? "Exit: 0"
                    : "Terminal Ready"}
                </span>

                {output && (
                  <button
                    onClick={handleCopyOutput}
                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                    title="Copy output"
                  >
                    {copiedOutput ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                )}

                <button
                  onClick={() => {
                    setOutput("");
                    setOutputStatus("cleared");
                  }}
                  className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                  title="Clear console"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Output Display Terminal Body */}
            <div className="font-mono text-xs sm:text-[13px] bg-[#0f131a] p-3.5 rounded-xl border border-slate-800/80 min-h-[120px] max-h-[220px] overflow-auto leading-relaxed text-emerald-400/90 whitespace-pre">
              {output ? (
                output
              ) : (
                <span className="text-slate-500 italic">
                  $ Click &quot;Run Code&quot; or &quot;Explain Code&quot; to execute and view stdout/stderr output here...
                </span>
              )}
            </div>
          </Card>
        </div>

        {/* ================= RIGHT COLUMN: Step-by-Step Explanation Console (5 Cols Beside Code) ================= */}
        <div className="lg:col-span-5 space-y-4">
          {explanation ? (
            <Card className="p-4 sm:p-6 bg-surface/95 border-line shadow-lg space-y-5 animate-fadeUp">
              {/* Header & Concept Title */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-light text-accent-dark uppercase tracking-wide">
                    <BookOpen size={11} /> {explanation.language}
                  </span>
                  <span className="text-[11px] text-subink font-semibold">
                    {explanation.line_by_line.length} Steps Identified
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-ink">
                  {explanation.concept.title}
                </h3>
                <p className="text-xs text-subink mt-1 leading-relaxed">
                  {explanation.concept.explanation}
                </p>
              </div>

              {/* Tab Navigation Beside Code */}
              <div className="flex items-center gap-1 bg-paper p-1 rounded-xl border border-line text-xs font-semibold">
                <button
                  onClick={() => setActiveTab("steps")}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    activeTab === "steps"
                      ? "bg-accent text-white shadow-sm"
                      : "text-subink hover:text-ink"
                  }`}
                >
                  Step by Step
                </button>
                <button
                  onClick={() => setActiveTab("flow")}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    activeTab === "flow"
                      ? "bg-accent text-white shadow-sm"
                      : "text-subink hover:text-ink"
                  }`}
                >
                  Execution Flow
                </button>
                <button
                  onClick={() => setActiveTab("concepts")}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    activeTab === "concepts"
                      ? "bg-accent text-white shadow-sm"
                      : "text-subink hover:text-ink"
                  }`}
                >
                  Concepts
                </button>
                <button
                  onClick={() => setActiveTab("mistakes")}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    activeTab === "mistakes"
                      ? "bg-accent text-white shadow-sm"
                      : "text-subink hover:text-ink"
                  }`}
                >
                  Mistakes
                </button>
              </div>

              {/* ================= TAB 1: STEP BY STEP LINE EXPLANATION ================= */}
              {activeTab === "steps" && (
                <div className="space-y-4 animate-fadeUp">
                  {/* Stepper Navigation Bar */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-paper border border-line">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSelectLine(Math.max(1, safeSelectedLine - 1))}
                        disabled={safeSelectedLine <= 1}
                        className="p-1.5 rounded-lg hover:bg-white text-ink border border-transparent hover:border-line disabled:opacity-30 transition"
                        title="Previous line step"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <span className="text-xs font-bold text-ink px-1.5">
                        Step {safeSelectedLine} of {totalLines}
                      </span>

                      <button
                        onClick={() => handleSelectLine(Math.min(totalLines, safeSelectedLine + 1))}
                        disabled={safeSelectedLine >= totalLines}
                        className="p-1.5 rounded-lg hover:bg-white text-ink border border-transparent hover:border-line disabled:opacity-30 transition"
                        title="Next line step"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Auto Walkthrough Play/Pause */}
                    <button
                      onClick={() => setIsPlayingSteps(!isPlayingSteps)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        isPlayingSteps
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-accent-light text-accent-dark hover:brightness-95"
                      }`}
                    >
                      {isPlayingSteps ? (
                        <>
                          <Pause size={12} /> <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play size={12} fill="currentColor" /> <span>Auto Play</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Active Step Highlighted Card */}
                  {activeLineExplanation && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-surface to-accent-light/20 border-2 border-accent/40 shadow-sm space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-accent text-white">
                          Line {safeSelectedLine}
                        </span>
                        {activeLineExplanation.important_concept && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-line text-accent-dark">
                            {activeLineExplanation.important_concept}
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#1e2430] text-slate-100 font-mono text-xs overflow-x-auto">
                        <code>{currentLineCode || activeLineExplanation.code || `// Line ${safeSelectedLine}`}</code>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-white/80 border border-line/60">
                          <span className="text-[11px] font-bold uppercase text-accent-dark block mb-0.5">
                            💡 What this line does:
                          </span>
                          <p className="text-ink leading-relaxed">
                            {activeLineExplanation.explanation}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/80 border border-line/60">
                          <span className="text-[11px] font-bold uppercase text-emerald-800 block mb-0.5">
                            🔍 Why it is needed:
                          </span>
                          <p className="text-subink leading-relaxed">
                            {activeLineExplanation.why}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scrollable Step List */}
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {codeLines.map((lineText, idx) => {
                      const lineNum = idx + 1;
                      const isSelected = safeSelectedLine === lineNum;
                      const stepItem =
                        explanation.line_by_line.find((item) => item.line === lineNum) ||
                        explainSingleLine(lineText, lineNum, explanation.language || language);

                      return (
                        <div
                          key={lineNum}
                          onClick={() => handleSelectLine(lineNum)}
                          className={`p-3 rounded-xl border transition cursor-pointer text-xs ${
                            isSelected
                              ? "bg-accent-light text-accent-dark border-accent font-medium shadow-sm ring-1 ring-accent/30"
                              : "bg-paper/70 text-subink border-line/70 hover:bg-paper hover:text-ink"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold font-mono">Line {lineNum}</span>
                            <span className="font-mono text-[11px] truncate max-w-[170px] opacity-80">
                              {lineText.trim() || `(empty line)`}
                            </span>
                          </div>
                          <p className="line-clamp-2 leading-relaxed text-[11px]">
                            {stepItem.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= TAB 2: EXECUTION FLOW ================= */}
              {activeTab === "flow" && (
                <div className="space-y-2.5 animate-fadeUp max-h-[380px] overflow-y-auto pr-1">
                  {explanation.execution_flow.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-paper border border-line text-xs text-ink"
                    >
                      <span className="w-5 h-5 rounded-full bg-accent-light text-accent-dark font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, "")}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ================= TAB 3: CONCEPTS USED ================= */}
              {activeTab === "concepts" && (
                <div className="space-y-2.5 animate-fadeUp max-h-[380px] overflow-y-auto pr-1">
                  {explanation.concepts_used.map((concept, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-line bg-paper/60 space-y-1">
                      <div className="font-bold text-xs text-ink flex items-center gap-1.5">
                        <Layers size={13} className="text-accent" />
                        <span>{concept.name}</span>
                      </div>
                      <p className="text-[11px] text-subink leading-relaxed">
                        {concept.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* ================= TAB 4: COMMON MISTAKES ================= */}
              {activeTab === "mistakes" && (
                <div className="space-y-3 animate-fadeUp max-h-[380px] overflow-y-auto pr-1">
                  {explanation.common_mistakes.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-peer-critic/20 bg-peer-criticBg/40 space-y-1.5"
                    >
                      <h4 className="font-bold text-xs text-ink flex items-center gap-1.5">
                        <span>⚠️</span> {m.mistake}
                      </h4>
                      <p className="text-[11px] text-subink leading-relaxed">{m.explanation}</p>
                      {m.example_bad && (
                        <div className="text-[10px] font-mono bg-white p-2 rounded border border-line text-ink mt-1">
                          <div className="text-peer-critic">❌ {m.example_bad}</div>
                          {m.example_good && (
                            <div className="text-emerald-600 mt-0.5">✅ {m.example_good}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            /* Empty Placeholder State */
            <Card className="p-8 text-center bg-surface/80 border-dashed border-2 border-line space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-accent-light text-accent-dark flex items-center justify-center mx-auto">
                <Lightbulb size={24} />
              </div>
              <h3 className="font-display font-semibold text-base text-ink">
                Step-by-Step Explanation Console
              </h3>
              <p className="text-xs text-subink leading-relaxed max-w-sm mx-auto">
                Click <strong>&quot;Explain Code Step by Step&quot;</strong> to activate the live walkthrough. Explanations will highlight line-by-line in sync with the source code.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* ================= LOWER SECTION: Practice Task & Student Workbench ================= */}
      {explanation && (
        <Card className="p-6 sm:p-8 bg-gradient-to-b from-surface to-paper border-line shadow-md space-y-6 animate-fadeUp">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent text-white flex items-center justify-center font-bold">
                🎯
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-light text-accent-dark uppercase tracking-wider">
                    {explanation.practice_task.difficulty} Task
                  </span>
                  <span className="text-xs text-subink font-medium">Practice Time</span>
                </div>
                <h3 className="font-display font-semibold text-xl text-ink mt-0.5">
                  {explanation.practice_task.title}
                </h3>
              </div>
            </div>

            {/* Challenge Level Switcher */}
            {challenges.length > 0 && (
              <div className="flex items-center gap-1 bg-paper p-1 rounded-xl border border-line">
                {challenges.map((ch) => (
                  <button
                    key={ch.level}
                    onClick={() => handleSelectChallenge(ch)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeChallengeLevel === ch.level
                        ? "bg-accent text-white shadow-sm"
                        : "text-subink hover:text-ink"
                    }`}
                  >
                    Lvl {ch.level}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Task Prompt */}
          <div className="p-4 sm:p-5 rounded-2xl bg-paper border border-line/80">
            <p className="text-sm sm:text-base font-medium text-ink leading-relaxed">
              {explanation.practice_task.description}
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-line/50">
              <span className="text-xs text-subink font-medium">Concepts to practice:</span>
              {explanation.practice_task.concepts.map((c, i) => (
                <span
                  key={i}
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white border border-line text-ink"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Collapsible Hints */}
          {explanation.practice_task.hints.length > 0 && (
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowHints(!showHints)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-amber-900 hover:bg-amber-100/40 transition"
              >
                <span className="flex items-center gap-2">
                  <Lightbulb size={15} className="text-amber-600" />
                  Need a Hint? (We encourage thinking before looking!)
                </span>
                {showHints ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showHints && (
                <div className="px-5 pb-4 pt-1 space-y-2 border-t border-amber-200/50 text-xs text-amber-950 animate-fadeUp">
                  {explanation.practice_task.hints.map((hint, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-amber-700">💡 Hint {idx + 1}:</span>
                      <span>{hint}</span>
                    </div>
                  ))}
                  <p className="text-[11px] font-medium text-amber-800 italic pt-1">
                    Can you write and complete the program yourself now?
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Student Code Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                Your Solution Code ({explanation.language})
              </label>
              <span className="text-[11px] text-subink">
                Type your solution and test or submit to verify output
              </span>
            </div>

            <div className="relative rounded-2xl border border-line bg-[#1e2430] text-slate-100 font-mono text-xs sm:text-sm overflow-hidden shadow-inner focus-within:border-accent">
              <div className="flex items-center justify-between px-4 py-2 bg-[#171c26] border-b border-slate-700/60 text-slate-400 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-sans font-medium text-[11px] text-slate-300">
                    Student Workbench • {explanation.language}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStudentCode("");
                    setStudentOutput("");
                    setStudentOutputStatus("idle");
                  }}
                  className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1"
                >
                  <Trash2 size={11} />
                  <span>Clear Editor</span>
                </button>
              </div>

              <textarea
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder={`Write your ${explanation.language} code solution here...`}
                rows={7}
                className="w-full bg-transparent text-slate-100 p-4 focus:outline-none resize-none leading-6 font-mono text-xs sm:text-sm"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Action Bar: Run & Test, Submit Solution, Reference Solution */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Button 1: Run & Test Solution Output */}
              <button
                onClick={handleRunStudentCode}
                disabled={testingSolution || evaluating || !studentCode.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-paper hover:bg-line border border-line text-ink font-semibold text-xs sm:text-sm transition shadow-sm disabled:opacity-50"
                title="Execute your code and inspect output in the Current Output console"
              >
                {testingSolution ? (
                  <Loader2 size={15} className="animate-spin text-accent" />
                ) : (
                  <Play size={15} className="text-emerald-600 fill-emerald-600" />
                )}
                <span>Run &amp; Test Solution</span>
              </button>

              {/* Button 2: Submit & Check Correctness */}
              <button
                onClick={handleSubmitSolution}
                disabled={evaluating || testingSolution || !studentCode.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs sm:text-sm hover:bg-accent-dark transition shadow-md disabled:opacity-50"
                title="Submit solution to check whether it is correct or incorrect"
              >
                {evaluating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Evaluating Solution...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Submit &amp; Check Solution</span>
                  </>
                )}
              </button>

              {explanation.practice_task.reference_solution && (
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-line bg-paper text-ink hover:bg-white text-xs font-semibold transition"
                >
                  <Eye size={15} className="text-subink" />
                  <span>{showSolution ? "Hide Solution" : "Show Reference Solution"}</span>
                </button>
              )}
            </div>

            <span className="text-[11px] text-subink font-medium">
              Run test or submit to see if your code output matches the target.
            </span>
          </div>

          {/* ================= SEPARATE CONSOLES: EXPECTED OUTPUT VS CURRENT OUTPUT ================= */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Terminal size={14} className="text-accent" /> Output Verification Consoles
              </span>
              <span className="text-[11px] text-subink">
                Compare your current output against expected problem output
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Console 1: Expected Output */}
              <div className="rounded-2xl border border-line bg-[#141922] text-slate-100 font-mono text-xs overflow-hidden shadow-lg flex flex-col">
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0e1218] border-b border-slate-700/60 text-slate-300">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-500/80" />
                    </div>
                    <div className="flex items-center gap-1.5 ml-1 text-slate-200 font-sans font-semibold text-xs">
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      <span>Expected Output (Target)</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const exp = explanation.practice_task.expected_output || "2\n4\n6\n8\n10";
                      navigator.clipboard.writeText(exp);
                      setCopiedExpectedOutput(true);
                      setTimeout(() => setCopiedExpectedOutput(false), 2000);
                    }}
                    className="p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 transition"
                    title="Copy expected output"
                  >
                    {copiedExpectedOutput ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>

                <div className="p-3.5 bg-[#090d14] min-h-[110px] max-h-[170px] overflow-auto text-emerald-300/90 whitespace-pre leading-relaxed font-mono select-text flex-1">
                  {explanation.practice_task.expected_output || "2\n4\n6\n8\n10"}
                </div>
              </div>

              {/* Console 2: Current Output */}
              <div className="rounded-2xl border border-line bg-[#141922] text-slate-100 font-mono text-xs overflow-hidden shadow-lg flex flex-col">
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0e1218] border-b border-slate-700/60 text-slate-300">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="flex items-center gap-1.5 ml-1 text-slate-200 font-sans font-semibold text-xs">
                      <Terminal size={13} className="text-accent" />
                      <span>Current Output (Your Code)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        studentOutputStatus === "matched"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : studentOutputStatus === "error"
                          ? "bg-rose-950 text-rose-400 border border-rose-800"
                          : studentOutputStatus === "mismatched"
                          ? "bg-amber-950 text-amber-400 border border-amber-800"
                          : studentOutputStatus === "running"
                          ? "bg-blue-950 text-blue-400 border border-blue-800"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {studentOutputStatus === "running"
                        ? "Executing..."
                        : studentOutputStatus === "matched"
                        ? "Matches Target ✅"
                        : studentOutputStatus === "mismatched"
                        ? "Output Mismatch ❌"
                        : studentOutputStatus === "error"
                        ? "Syntax / Error ⚠️"
                        : "Ready"}
                    </span>

                    {studentOutput && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(studentOutput);
                          setCopiedStudentOutput(true);
                          setTimeout(() => setCopiedStudentOutput(false), 2000);
                        }}
                        className="p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 transition"
                        title="Copy your output"
                      >
                        {copiedStudentOutput ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className={`p-3.5 bg-[#090d14] min-h-[110px] max-h-[170px] overflow-auto whitespace-pre leading-relaxed font-mono select-text flex-1 ${
                    studentOutputStatus === "error"
                      ? "text-rose-400"
                      : studentOutputStatus === "matched"
                      ? "text-emerald-400"
                      : studentOutputStatus === "mismatched"
                      ? "text-amber-300"
                      : "text-slate-300"
                  }`}
                >
                  {studentOutput ? (
                    studentOutput
                  ) : (
                    <span className="text-slate-500 italic">
                      $ Click &quot;Run &amp; Test Solution&quot; or &quot;Submit Solution&quot; to execute your code and see stdout here...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ================= CORRECT / INCORRECT VERIFICATION BANNER ================= */}
          {feedback && (
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-wrap items-center justify-between gap-4 animate-fadeUp ${
                feedback.is_correct
                  ? "bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border-emerald-500/40 text-emerald-950 shadow-sm ring-1 ring-emerald-500/20"
                  : "bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-rose-500/15 border-rose-500/40 text-rose-950 shadow-sm ring-1 ring-rose-500/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 shadow-sm ${
                    feedback.is_correct ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                  }`}
                >
                  {feedback.is_correct ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                        feedback.is_correct
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                      }`}
                    >
                      {feedback.is_correct ? "Solution Correct (Passed)" : "Solution Incorrect (Needs Fix)"}
                    </span>
                    <span className="text-xs font-semibold text-subink">
                      {feedback.understanding}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium mt-1 text-ink">
                    {feedback.is_correct
                      ? "All requirements fulfilled! Your solution outputs the expected values accurately."
                      : "The submitted code did not match the expected output or contains a syntax/compilation error."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Detailed Feedback Cards */}
          {feedback && (
            <div className="p-5 sm:p-6 rounded-2xl border border-line bg-surface shadow-md space-y-4 animate-fadeUp">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-line">
                <h4 className="font-display font-semibold text-base text-ink flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" /> Detailed Tutor Feedback
                </h4>
                <span
                  className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    feedback.is_correct
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {feedback.is_correct ? "Passed" : "Needs Revision"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 space-y-1">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600" /> What You Did Well
                  </span>
                  <p className="text-emerald-950 leading-relaxed">{feedback.what_you_did_well}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-paper border border-line space-y-1">
                  <span className="font-bold text-ink flex items-center gap-1.5">
                    <HelpCircle size={15} className="text-accent" /> What Needs Improvement
                  </span>
                  <p className="text-subink leading-relaxed">
                    {feedback.what_needs_improvement}
                  </p>
                </div>
              </div>

              {feedback.hint && (
                <div className="p-3 rounded-xl bg-accent-light/50 border border-accent/20 text-xs text-accent-dark flex items-center gap-2">
                  <Lightbulb size={16} className="shrink-0" />
                  <span>
                    <strong>Next Step:</strong> {feedback.hint}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Revealed Reference Solution */}
          {showSolution && explanation.practice_task.reference_solution && (
            <div className="p-5 sm:p-6 rounded-2xl border border-line bg-surface shadow-md space-y-4 animate-fadeUp">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-semibold text-base text-ink flex items-center gap-2">
                  <Code2 size={16} className="text-accent-dark" /> Reference Solution
                </h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent-light text-accent-dark">
                  {explanation.language}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#1e2430] text-slate-100 font-mono text-xs sm:text-sm overflow-x-auto">
                <pre>{explanation.practice_task.reference_solution}</pre>
              </div>

              {explanation.practice_task.solution_explanation && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">
                    Solution Breakdown:
                  </span>
                  {explanation.practice_task.solution_explanation.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-xs p-2.5 rounded-lg bg-paper border border-line flex items-start gap-2.5"
                    >
                      <code className="font-mono text-ink font-semibold">{item.code}</code>
                      <span className="text-subink">— {item.explanation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Difficulty Progression Challenges */}
          {challenges.length > 0 && (
            <div className="pt-4 border-t border-line space-y-3">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-amber-600" />
                <h4 className="font-display font-semibold text-sm text-ink">
                  Difficulty Progression: Next Challenges
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {challenges.map((item) => (
                  <div
                    key={item.level}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between cursor-pointer ${
                      activeChallengeLevel === item.level
                        ? "border-accent bg-accent-light/30 shadow-md ring-1 ring-accent"
                        : "border-line bg-paper/50 hover:bg-paper hover:border-line/80"
                    }`}
                    onClick={() => handleSelectChallenge(item)}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold text-accent-dark px-2 py-0.5 rounded-full bg-accent-light">
                          {item.level_name}
                        </span>
                        {activeChallengeLevel === item.level && (
                          <span className="text-xs font-bold text-accent-dark flex items-center gap-1">
                            <Check size={14} /> Active
                          </span>
                        )}
                      </div>
                      <h5 className="font-semibold text-xs sm:text-sm text-ink mb-1.5">
                        {item.title}
                      </h5>
                      <p className="text-xs text-subink line-clamp-3">{item.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectChallenge(item);
                      }}
                      className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-accent-dark hover:underline"
                    >
                      <span>Load Challenge</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
