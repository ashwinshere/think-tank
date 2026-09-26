import * as admin from "firebase-admin";

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "thinktank-ai-2e2f7";
let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

if (!clientEmail || !clientEmail.includes("@")) {
  clientEmail = `firebase-adminsdk-fbsvc@${projectId}.iam.gserviceaccount.com`;
}

if (!admin.apps.length) {
  try {
    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      admin.initializeApp({
        projectId,
      });
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

