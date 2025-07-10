"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, BookOpen, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  createdAt: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminDebug, setAdminDebug] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const adminStatus = await checkAdminStatus(user.uid);
        if (adminStatus) {
          await fetchSubjects();
        }
      } else {
        router.push("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const checkAdminStatus = async (userId: string) => {
    try {
      const adminDoc = await getDoc(doc(db, "admins", userId));
      const docExists = adminDoc.exists();
      const docData = adminDoc.data();
      const isAdminUser = docExists && docData?.role === "admin";
      setAdminDebug(
        `exists: ${docExists}, data: ${JSON.stringify(
          docData
        )}, isAdmin: ${isAdminUser}`
      );
      setIsAdmin(isAdminUser);
      return isAdminUser;
    } catch (error) {
      setAdminDebug(`Error: ${error}`);
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  const fetchSubjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "subjects"));
      const subjectList: Subject[] = [];

      querySnapshot.forEach((doc) => {
        subjectList.push({ id: doc.id, ...doc.data() } as Subject);
      });

      setSubjects(subjectList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSubjectName.trim()) {
      toast.error("Please enter a subject name");
      return;
    }

    try {
      // Show we're attempting to add the document
      toast.info("Attempting to add subject...");
      console.log("Attempting to add subject to Firestore...");

      // Add a longer timeout to catch if the request is blocked
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Request timed out - might be blocked by an extension or firewall"
              )
            ),
          10000
        )
      );

      // Race between the actual request and the timeout
      const result = await Promise.race([
        addDoc(collection(db, "subjects"), {
          name: newSubjectName.trim(),
          createdAt: new Date().toISOString(),
        }),
        timeoutPromise,
      ]);

      console.log("Subject add operation successful:", result);
      setNewSubjectName("");
      await fetchSubjects();
      toast.success("Subject added successfully");
    } catch (error: any) {
      console.error("Error adding subject:", error);

      // Get detailed error information
      const errorDetails = {
        message: error.message || "Unknown error",
        code: error.code || "No error code",
        name: error.name || "Unknown error type",
        stack: error.stack || "No stack trace",
      };

      console.log("Detailed error information:", errorDetails);

      // More descriptive error message with debugging info
      toast.error(`Failed to add subject: ${errorDetails.message}`, {
        description:
          "This may be caused by a browser extension blocking Firebase. Try disabling ad blockers or privacy extensions. Error code: " +
          errorDetails.code,
        duration: 10000,
      });
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this subject? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "subjects", subjectId));
      await fetchSubjects();
      toast.success("Subject deleted successfully");
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error("Failed to delete subject");
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md card-dark border-primary/30">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <CardTitle className="text-foreground heading-text">
                ACCESS DENIED
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              You don't have admin privileges.
            </CardDescription>
            <CardDescription className="text-xs text-muted-foreground/70 mt-2 font-mono">
              {adminDebug}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full button-glow bg-primary text-primary-foreground"
            >
              RETURN TO DASHBOARD
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Glow effects */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] z-0 opacity-60"></div>
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[120px] z-0 opacity-40"></div>

      {/* Header */}
      <header className="bg-card/30 backdrop-blur-md border-b border-primary/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="gap-2 border-primary/20 hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4 text-primary" />
                BACK
              </Button>
              <div>
                <h1 className="text-2xl font-bold heading-text">ADMIN PANEL</h1>
                <p className="text-sm text-muted-foreground">
                  Manage subjects and system settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <style jsx global>{`
          .bg-size-200 {
            background-size: 200% 100%;
          }
          .bg-pos-0 {
            background-position: 0% 0%;
          }
          .bg-pos-100 {
            background-position: 100% 0%;
          }
        `}</style>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Subject Form */}
          <Card className="card-dark border-primary/20 overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full"></div>
            <CardHeader className="border-b border-primary/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="heading-text text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
                    ADD NEW SUBJECT
                  </CardTitle>
                  <CardDescription>
                    Add subjects that users can select when recording leaves
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSubject} className="space-y-6">
                <div className="relative group">
                  <Label
                    htmlFor="subjectName"
                    className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center"
                  >
                    Subject Name <span className="text-primary ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="subjectName"
                      type="text"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="Enter subject name"
                      className="bg-secondary/70 border-primary/20 focus:border-primary focus:ring-primary/30 pr-10 transition-all duration-300"
                    />
                    <BookOpen className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary/30 group-focus-within:text-primary w-5 h-5 transition-all duration-300" />
                  </div>
                  <div className="h-0.5 w-0 bg-primary group-focus-within:w-full transition-all duration-500 mt-0.5 opacity-70"></div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary via-blue-500 to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-primary-foreground font-medium shadow-md transition-all duration-500 py-6 mt-2"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  ADD SUBJECT
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Subjects List */}
          <Card className="card-dark border-primary/20 overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full"></div>
            <CardHeader className="border-b border-primary/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="heading-text text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
                    EXISTING SUBJECTS
                  </CardTitle>
                  <CardDescription>
                    Manage all subjects in the system
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-primary/20 rounded-lg bg-gradient-to-r from-secondary/30 via-secondary/20 to-secondary/30 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full opacity-40"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-tr-full opacity-30"></div>
                  <BookOpen className="h-12 w-12 text-primary/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">
                    No subjects added yet
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Add your first subject to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="relative overflow-hidden p-3 border border-primary/20 rounded-lg group hover:border-primary/40 transition-all duration-300 bg-gradient-to-r from-secondary/80 via-secondary/50 to-secondary/80"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full opacity-40"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary/5 rounded-tr-full opacity-30"></div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-gradient-to-br from-primary/90 via-blue-500/80 to-fuchsia-600/70 p-1 rounded-lg shadow-lg">
                            <div className="flex items-center justify-center w-12 h-12 bg-white/90 rounded-md shadow-inner">
                              <span className="text-2xl font-black text-primary drop-shadow-md">
                                {subject.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                              {subject.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(subject.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDeleteSubject(subject.id)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive bg-card/50 backdrop-blur-sm shadow-sm border border-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
