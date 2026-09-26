import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "./firebase-admin";

export const AUTH_COOKIE_NAME = "thinktank_token";

export interface AuthUser {
  id: string; // Firebase UID
  email: string;
  name: string;
}

/**
 * Server-side Firebase user extractor.
 * Verifies Firebase ID token from Authorization header or cookie.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  try {
    let token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }
    }

    if (!token) return null;

    try {
      const decoded = await adminAuth.verifyIdToken(token);
      const email = decoded.email || "";
      const name = decoded.name || email.split("@")[0] || "Student";

      return {
        id: decoded.uid,
        email,
        name,
      };
    } catch (verifyErr) {
      // If verifyIdToken fails (e.g. expired or dev mock token), log gently and return null
      return null;
    }
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
