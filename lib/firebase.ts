import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Firebase configuration with fallback values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Validate Firebase configuration
const isFirebaseConfigValid = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
};

// Initialize Firebase only if config is valid
let app: any = null;
let auth: any = null;
let db: any = null;

if (isFirebaseConfigValid()) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn(
    "Firebase configuration is incomplete. Please check your environment variables."
  );
}

// Helper function to get the current user ID
const getCurrentUserId = (): string | null => {
  if (!auth) return null;
  return auth.currentUser?.uid || null;
};

// Helper function to make a user an admin
const makeUserAdmin = async (userId: string): Promise<boolean> => {
  if (!db) return false;
  try {
    await setDoc(doc(db, "admins", userId), {
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error making user admin:", error);
    return false;
  }
};

// Helper function to make the current user an admin
const makeCurrentUserAdmin = async (): Promise<boolean> => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  return await makeUserAdmin(userId);
};

// Helper function to check if the current user is an admin
const isCurrentUserAdmin = async (): Promise<boolean> => {
  if (!auth || !db) return false;
  const userId = getCurrentUserId();
  if (!userId) return false;
  try {
    const adminDoc = await getDoc(doc(db, "admins", userId));
    return adminDoc.exists() && adminDoc.data()?.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Add these to window for console access in development
if (typeof window !== "undefined") {
  // @ts-ignore
  window.leaveManagerHelpers = {
    getCurrentUserId,
    makeUserAdmin,
    makeCurrentUserAdmin,
    isCurrentUserAdmin,
  };
}

export {
  auth,
  db,
  isFirebaseConfigValid,
  getCurrentUserId,
  makeUserAdmin,
  makeCurrentUserAdmin,
  isCurrentUserAdmin,
};
