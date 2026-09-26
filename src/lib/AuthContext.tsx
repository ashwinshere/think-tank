"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase-client";

export interface User {
  id: string; // Firebase UID
  email: string;
  name: string;
}

export interface UserProfile {
  displayName: string | null;
  bio: string | null;
  learningGoals: string | null;
  education?: string | null;
  occupation?: string | null;
  experienceLevel: string | null;
  personalizationEnabled: boolean;
}

export interface UserPreference {
  id: string;
  key: string;
  value: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  preferences: UserPreference[];
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ ok: boolean; error?: string }>;
  getIdToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [loading, setLoading] = useState(true);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      if (!auth.currentUser) {
        setUser(null);
        setProfile(null);
        setPreferences([]);
        setLoading(false);
        return;
      }

      const idToken = await auth.currentUser.getIdToken();
      // Sync cookie for Next.js server requests
      document.cookie = `thinktank_token=${idToken}; path=/; max-age=2592000; SameSite=Lax`;

      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
        setPreferences(data.preferences || []);
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        document.cookie = `thinktank_token=${token}; path=/; max-age=2592000; SameSite=Lax`;

        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Student",
        });

        await refreshUser();
      } else {
        document.cookie = "thinktank_token=; path=/; max-age=0; SameSite=Lax";
        setUser(null);
        setProfile(null);
        setPreferences([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      document.cookie = `thinktank_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
      await refreshUser();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Login failed" };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateFirebaseProfile(cred.user, { displayName: name });
      const token = await cred.user.getIdToken();
      document.cookie = `thinktank_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
      await refreshUser();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Registration failed" };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const token = await cred.user.getIdToken();
      document.cookie = `thinktank_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
      await refreshUser();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Google sign-in failed" };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      document.cookie = "thinktank_token=; path=/; max-age=0; SameSite=Lax";
      setUser(null);
      setProfile(null);
      setPreferences([]);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      const token = await getIdToken();
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { ok: false, error: resData.error || "Failed to update profile" };
      }
      setProfile(resData.profile);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Network error" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        preferences,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateProfile,
        getIdToken,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
