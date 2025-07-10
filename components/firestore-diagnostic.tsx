import { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import {
  testFirebaseConnectivity,
  detectPotentialBlockers,
  getErrorRecommendation,
} from "@/lib/firestore-troubleshoot";

export default function FirestoreDiagnostic() {
  const [status, setStatus] = useState<{
    read: "idle" | "success" | "error";
    write: "idle" | "success" | "error";
    delete: "idle" | "success" | "error";
    connectivity: "idle" | "success" | "error";
  }>({
    read: "idle",
    write: "idle",
    delete: "idle",
    connectivity: "idle",
  });
  const [testDocId, setTestDocId] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  const DIAGNOSTIC_COLLECTION = "diagnostics";

  const testConnectivity = async () => {
    setStatus((prev) => ({ ...prev, connectivity: "idle" }));
    setErrorDetails(null);

    try {
      console.log("Testing Firebase connectivity...");
      const results = await testFirebaseConnectivity();
      const potentialBlockers = detectPotentialBlockers();
      setBlockers(potentialBlockers);

      console.log("Connectivity test results:", results);
      const hasError = results.some((result) => result.status === "error");

      if (hasError) {
        setStatus((prev) => ({ ...prev, connectivity: "error" }));
        setErrorDetails(JSON.stringify(results, null, 2));
        setRecommendation(
          potentialBlockers.length > 0
            ? "Consider disabling detected browser extensions or try a different browser."
            : "Check your network connection and firewall settings."
        );
        toast.error("Connectivity test failed", {
          description: "Some Firebase endpoints are unreachable",
        });
      } else {
        setStatus((prev) => ({ ...prev, connectivity: "success" }));
        toast.success("Firebase connectivity test passed!");

        if (potentialBlockers.length > 0) {
          setRecommendation(
            `Potential blockers detected: ${potentialBlockers.join(
              ", "
            )}. These may interfere with Firebase operations.`
          );
        } else {
          setRecommendation(
            "No obvious blockers detected. If you're still experiencing issues, check your Firebase configuration."
          );
        }
      }
    } catch (error: any) {
      console.error("Connectivity test failed:", error);
      setStatus((prev) => ({ ...prev, connectivity: "error" }));
      setErrorDetails(error.message || "Unknown error");
      setRecommendation(getErrorRecommendation(error));
      toast.error("Connectivity test failed", {
        description: error.message,
      });
    }
  };

  const testRead = async () => {
    setStatus((prev) => ({ ...prev, read: "idle" }));
    setErrorDetails(null);

    try {
      console.log("Testing Firestore read operation...");
      const querySnapshot = await getDocs(
        collection(db, DIAGNOSTIC_COLLECTION)
      );
      console.log("Read operation successful, docs found:", querySnapshot.size);
      setStatus((prev) => ({ ...prev, read: "success" }));
      toast.success("Firestore read test successful!");
    } catch (error: any) {
      console.error("Firestore read test failed:", error);
      setStatus((prev) => ({ ...prev, read: "error" }));
      setErrorDetails(
        JSON.stringify(
          {
            operation: "read",
            message: error.message,
            code: error.code,
            name: error.name,
          },
          null,
          2
        )
      );
      setRecommendation(getErrorRecommendation(error));
      toast.error("Firestore read test failed", {
        description: error.message,
      });
    }
  };

  const testWrite = async () => {
    setStatus((prev) => ({ ...prev, write: "idle" }));
    setErrorDetails(null);

    try {
      console.log("Testing Firestore write operation...");
      const docRef = await addDoc(collection(db, DIAGNOSTIC_COLLECTION), {
        timestamp: new Date().toISOString(),
        test: "diagnostic",
      });
      console.log("Write operation successful, doc ID:", docRef.id);
      setTestDocId(docRef.id);
      setStatus((prev) => ({ ...prev, write: "success" }));
      toast.success("Firestore write test successful!");
    } catch (error: any) {
      console.error("Firestore write test failed:", error);
      setStatus((prev) => ({ ...prev, write: "error" }));
      setErrorDetails(
        JSON.stringify(
          {
            operation: "write",
            message: error.message,
            code: error.code,
            name: error.name,
          },
          null,
          2
        )
      );
      setRecommendation(getErrorRecommendation(error));
      toast.error("Firestore write test failed", {
        description: error.message,
      });
    }
  };

  const testDelete = async () => {
    if (!testDocId) {
      toast.error("No test document to delete. Run the write test first.");
      return;
    }

    setStatus((prev) => ({ ...prev, delete: "idle" }));
    setErrorDetails(null);

    try {
      console.log("Testing Firestore delete operation...");
      await deleteDoc(doc(db, DIAGNOSTIC_COLLECTION, testDocId));
      console.log("Delete operation successful");
      setStatus((prev) => ({ ...prev, delete: "success" }));
      setTestDocId(null);
      toast.success("Firestore delete test successful!");
    } catch (error: any) {
      console.error("Firestore delete test failed:", error);
      setStatus((prev) => ({ ...prev, delete: "error" }));
      setErrorDetails(
        JSON.stringify(
          {
            operation: "delete",
            message: error.message,
            code: error.code,
            name: error.name,
          },
          null,
          2
        )
      );
      setRecommendation(getErrorRecommendation(error));
      toast.error("Firestore delete test failed", {
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status: "idle" | "success" | "error") => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Success</Badge>
        );
      case "error":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <Card className="nft-card w-full">
      <CardHeader>
        <CardTitle>Firestore Connection Diagnostic</CardTitle>
        <CardDescription>
          Test your Firestore connection to diagnose issues with adding or
          managing subjects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span>Connectivity Test:</span>
            {getStatusBadge(status.connectivity)}
          </div>
          <div className="flex items-center justify-between">
            <span>Read Test:</span>
            {getStatusBadge(status.read)}
          </div>
          <div className="flex items-center justify-between">
            <span>Write Test:</span>
            {getStatusBadge(status.write)}
          </div>
          <div className="flex items-center justify-between">
            <span>Delete Test:</span>
            {getStatusBadge(status.delete)}
          </div>

          {blockers.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 text-destructive">
                Potential Blockers Detected:
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                {blockers.map((blocker, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {blocker}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendation && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-md">
              <h4 className="font-medium mb-1">Recommendation:</h4>
              <p className="text-sm">{recommendation}</p>
            </div>
          )}

          {errorDetails && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Error Details:</h4>
              <pre className="p-3 bg-muted text-sm rounded-md overflow-auto max-h-40">
                {errorDetails}
              </pre>
            </div>
          )}

          {testDocId && (
            <div className="mt-2 text-sm">
              Test document created with ID:{" "}
              <code className="bg-muted p-1 rounded">{testDocId}</code>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          onClick={testConnectivity}
          variant="default"
          className="bg-primary text-primary-foreground"
        >
          Test Connectivity
        </Button>
        <Button onClick={testRead} variant="secondary">
          Test Read
        </Button>
        <Button onClick={testWrite} variant="secondary">
          Test Write
        </Button>
        <Button
          onClick={testDelete}
          variant="destructive"
          disabled={!testDocId}
        >
          Test Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
