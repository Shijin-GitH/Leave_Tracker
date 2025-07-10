/**
 * Firestore Troubleshooting Utility
 *
 * This utility provides functions to diagnose common Firestore connectivity issues.
 */

// Common error codes and their meaning
export const errorCodeGuide = {
  "permission-denied":
    "You do not have permission to access this resource. Check your Firestore rules.",
  unavailable:
    "Firestore service is currently unavailable. Check your internet connection.",
  "failed-precondition":
    "The operation failed because a condition was not met. This often occurs with transactions.",
  "resource-exhausted":
    "You have exceeded your Firestore quota or rate limits.",
  "not-found": "The requested document or collection was not found.",
  "already-exists": "The document you are trying to create already exists.",
  cancelled: "The operation was cancelled, typically by the user.",
  unknown:
    "An unknown error occurred. This might be due to client-side issues.",
  "invalid-argument": "Invalid argument provided to a Firestore method.",
  "deadline-exceeded": "The operation timed out.",
  unauthenticated:
    "The request does not have valid authentication credentials.",
};

// Browser-specific issues that might block Firestore
export const browserBlockingGuide = {
  ERR_BLOCKED_BY_CLIENT:
    "A browser extension or add-on is likely blocking the request. Try disabling ad-blockers or privacy extensions.",
  NetworkError:
    "Network request failed. This could be due to firewall settings or browser privacy features.",
  "Failed to fetch":
    "Network request failed, possibly due to CORS issues or browser security features.",
  AbortError:
    "The request was aborted. This can happen when a page navigates away or when a request is cancelled by the browser.",
  timeout:
    "The request timed out, which might indicate connectivity issues or server problems.",
};

// Check if firebase can connect to its services
export async function testFirebaseConnectivity() {
  const testEndpoints = [
    "https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel",
    "https://firestore.googleapis.com/",
  ];

  const results = await Promise.all(
    testEndpoints.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint, {
          method: "HEAD",
          mode: "no-cors", // This is necessary for cross-origin requests
        });
        return {
          endpoint,
          status: "success",
          details: "Connection appears to be working",
        };
      } catch (error: any) {
        return {
          endpoint,
          status: "error",
          details: error.message || "Unknown error",
        };
      }
    })
  );

  return results;
}

// Detect common browser extensions that might interfere with Firebase
export function detectPotentialBlockers() {
  const potentialBlockers: string[] = [];

  // Check for common ad blockers
  if (typeof window !== "undefined") {
    // Check if common ad blocker variables exist
    if (
      (window as any).google_ad_status === false ||
      (window as any).adsbygoogle === undefined ||
      (window as any).canRunAds === false
    ) {
      potentialBlockers.push("Ad blocker detected");
    }

    // Check for Privacy Badger
    if ((window as any)._privacy_badger_installed) {
      potentialBlockers.push("Privacy Badger extension detected");
    }

    // Check for Firefox tracking protection
    const isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;
    if (
      isFirefox &&
      (document as any).featurePolicy?.allowsFeature("interest-cohort")
    ) {
      potentialBlockers.push("Firefox tracking protection may be active");
    }
  }

  return potentialBlockers;
}

// Provide recommendations based on the error
export function getErrorRecommendation(error: any): string {
  if (!error) return "No error information provided";

  const errorMessage = error.message || "";
  const errorCode = error.code || "";

  // Check for browser blocking issues
  for (const [code, explanation] of Object.entries(browserBlockingGuide)) {
    if (errorMessage.includes(code)) {
      return `${explanation} Try temporarily disabling browser extensions, particularly ad blockers and privacy tools.`;
    }
  }

  // Check for Firebase error codes
  if (errorCodeGuide[errorCode as keyof typeof errorCodeGuide]) {
    return errorCodeGuide[errorCode as keyof typeof errorCodeGuide];
  }

  // Generic recommendations
  if (errorMessage.includes("network")) {
    return "This appears to be a network connectivity issue. Check your internet connection and firewall settings.";
  }

  if (errorMessage.includes("timeout")) {
    return "The request timed out. This could be due to poor connectivity or server-side delays.";
  }

  return "Unable to determine a specific recommendation. Try checking your internet connection, disabling browser extensions, or checking Firebase console for service status.";
}

// Export a function that can be called from the browser console for manual troubleshooting
if (typeof window !== "undefined") {
  (window as any).troubleshootFirestore = async () => {
    const connectivity = await testFirebaseConnectivity();
    const blockers = detectPotentialBlockers();

    return {
      connectivity,
      potentialBlockers: blockers,
      userAgent: navigator.userAgent,
      recommendation:
        blockers.length > 0
          ? "Consider disabling the detected browser extensions or try a different browser."
          : "No obvious blockers detected. Check your network connection or Firebase configuration.",
    };
  };
}
