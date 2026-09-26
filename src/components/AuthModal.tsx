"use client";

import { useState } from "react";
import { X, Lock, Mail, User, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        if (!name.trim()) {
          setError("Name is required");
          setLoading(false);
          return;
        }
        const res = await register(name, email, password);
        if (!res.ok) {
          setError(res.error || "Registration failed");
          setLoading(false);
          return;
        }
      } else {
        const res = await login(email, password);
        if (!res.ok) {
          setError(res.error || "Login failed");
          setLoading(false);
          return;
        }
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.ok) {
        setError(res.error || "Google sign-in failed");
        setLoading(false);
        return;
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeUp">
      <div className="relative w-full max-w-md rounded-2xl bg-surface border border-line shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-subink hover:text-ink hover:bg-paper transition"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-light text-accent-dark mb-3">
            <Sparkles size={24} />
          </div>
          <h2 className="font-display font-semibold text-xl text-ink">
            {mode === "login" ? "Welcome to ThinkTank" : "Create Your Account"}
          </h2>
          <p className="text-xs text-subink mt-1">
            {mode === "login"
              ? "Sign in with Firebase to access your saved conversations & personalized AI peers"
              : "Start learning with personalized AI peers that remember your goals"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-peer-criticBg border border-peer-critic/30 text-xs text-peer-critic font-medium leading-relaxed">
            {error.includes("auth/unauthorized-domain") ? (
              <div>
                <p className="font-semibold mb-1">Domain Not Authorized in Firebase</p>
                <p className="text-[11px] font-normal text-ink">
                  Add <code className="bg-white px-1.5 py-0.5 rounded font-mono text-accent-dark">{typeof window !== "undefined" ? window.location.hostname : "your-vercel-domain"}</code> to{" "}
                  <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</strong>.
                </p>
              </div>
            ) : (
              error
            )}
          </div>
        )}

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full mb-4 py-2.5 px-4 rounded-xl border border-line bg-paper hover:bg-white hover:border-accent font-medium text-xs text-ink transition flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-line w-full" />
          <span className="bg-surface px-2 text-[11px] text-subink font-medium uppercase tracking-wider shrink-0">
            or with email
          </span>
          <div className="border-t border-line w-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Your Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-3 text-subink" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ashwin Shere"
                  className="w-full rounded-xl border border-line pl-10 pr-4 py-2 text-xs sm:text-sm bg-paper focus:bg-white focus:border-accent outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-3 text-subink" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-line pl-10 pr-4 py-2 text-xs sm:text-sm bg-paper focus:bg-white focus:border-accent outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-3 text-subink" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-line pl-10 pr-4 py-2 text-xs sm:text-sm bg-paper focus:bg-white focus:border-accent outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-accent text-white font-medium text-xs sm:text-sm hover:bg-accent-dark transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {mode === "login" ? "Sign In with Email" : "Create Account"}
          </button>
        </form>

        <div className="mt-5 pt-3.5 border-t border-line text-center text-xs text-subink">
          {mode === "login" ? (
            <span>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className="font-semibold text-accent-dark hover:underline"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="font-semibold text-accent-dark hover:underline"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
