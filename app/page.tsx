"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, isFirebaseConfigValid } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if Firebase is properly configured
    if (!isFirebaseConfigValid()) {
      setError(
        "Firebase is not properly configured. Please check your environment variables."
      );
      setLoading(false);
      return;
    }

    if (!auth) {
      setError("Firebase authentication is not initialized.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    if (!auth) {
      setError("Firebase authentication is not available.");
      return;
    }

    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error signing in:", error);
      setError(`Sign-in failed: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 relative">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Glow effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[80px] z-0"></div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 h-screen flex flex-col items-center justify-center">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-8 border-destructive bg-destructive/10 max-w-md">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Logo and Heading */}
        <div className="text-center mb-12">
          <div className="mb-4 inline-block relative">
            <div className="w-24 h-24 rounded-xl bg-secondary flex items-center justify-center relative">
              <div className="absolute inset-0 border border-primary/50 rounded-xl glow-border"></div>
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-primary">
                <path
                  fill="currentColor"
                  d="M19,4h-1V3c0-0.6-0.4-1-1-1s-1,0.4-1,1v1H8V3c0-0.6-0.4-1-1-1S6,2.4,6,3v1H5C3.3,4,2,5.3,2,7v12c0,1.7,1.3,3,3,3h14c1.7,0,3-1.3,3-3V7C22,5.3,20.7,4,19,4z M20,19c0,0.6-0.4,1-1,1H5c-0.6,0-1-0.4-1-1v-8h16V19z M20,9H4V7c0-0.6,0.4-1,1-1h1v1c0,0.6,0.4,1,1,1s1-0.4,1-1V6h8v1c0,0.6,0.4,1,1,1s1-0.4,1-1V6h1c0.6,0,1,0.4,1,1V9z"
                />
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold text-xs">
              L.M
            </div>
          </div>

          <h1 className="heading-text text-4xl md:text-6xl text-foreground mb-2 glow-text">
            Leave Tracker
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-md mx-auto">
            Track and manage your leave records with precision
          </p>

          {/* Login button */}
          <Button
            size="lg"
            onClick={handleGoogleSignIn}
            className="button-glow bg-primary text-primary-foreground rounded-lg text-lg px-10 py-6 font-medium"
          >
            LOGIN WITH GOOGLE
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full py-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Leave Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
}
