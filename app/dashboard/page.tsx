"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { toast } from "sonner";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigValid } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Plus,
  LogOut,
  Settings,
  Eye,
  AlertTriangle,
  BarChart3,
  ListTodo,
  PieChart,
  User,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddLeaveModal } from "@/components/add-leave-modal";
import { LeaveDetailsModal } from "@/components/leave-details-modal";
import { Progress } from "@/components/ui/progress";
import { PercentageModal } from "@/components/percentage-modal";
import { useSubjects } from "@/hooks/use-subjects";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

interface LeaveRecord {
  id: string;
  subject: string;
  date: string;
  period?: string;
  dutyLeave?: boolean;
  reason?: string;
  certificateUrl?: string;
}

interface SubjectSummary {
  subject: string;
  count: number;
  dates: string[];
  dutyLeaveCount: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [subjectSummary, setSubjectSummary] = useState<SubjectSummary[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeaveRecord, setSelectedLeaveRecord] =
    useState<LeaveRecord | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("subjects");
  const [totalClasses, setTotalClasses] = useState<string>("");
  const [isPercentageModalOpen, setIsPercentageModalOpen] = useState(false);
  const [percentageResult, setPercentageResult] = useState<string | null>(null);
  const [percentageSubject, setPercentageSubject] = useState<string>("");
  const [percentageTotal, setPercentageTotal] = useState<number>(0);
  const router = useRouter();
  const { subjects: allSubjects, loading: loadingSubjects } = useSubjects();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [leaveToEdit, setLeaveToEdit] = useState<LeaveRecord | null>(null);
  const [uploadingCertificate, setUploadingCertificate] = useState<
    string | null
  >(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    // Check if Firebase is properly configured
    if (!isFirebaseConfigValid()) {
      setError("Firebase is not properly configured.");
      router.push("/");
      return;
    }

    if (!auth || !db) {
      setError("Firebase services are not initialized.");
      router.push("/");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          await checkAdminStatus(user.uid);
          await fetchLeaveRecords(user.uid);
        } catch (error: any) {
          console.error("Error loading user data:", error);
          setError(`Failed to load data: ${error.message}`);
        }
      } else {
        router.push("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const checkAdminStatus = async (userId: string) => {
    if (!db) return;

    try {
      const adminDoc = await getDoc(doc(db, "admins", userId));
      setIsAdmin(adminDoc.exists());
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const fetchLeaveRecords = async (userId: string) => {
    if (!db) return;

    try {
      const q = query(collection(db, "leaves"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const records: LeaveRecord[] = [];

      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as LeaveRecord);
      });

      setLeaveRecords(records);

      // Create subject summary
      const summary: { [key: string]: SubjectSummary } = {};
      records.forEach((record) => {
        // Try to match by subject id if possible, else fallback to name (case-insensitive)
        let subjectObj = allSubjects.find(
          (s) =>
            s.name.trim().toLowerCase() === record.subject.trim().toLowerCase()
        );
        // Fallback: if still not found, try to match by id
        if (!subjectObj && record.subject) {
          subjectObj = allSubjects.find((s) => s.id === record.subject);
        }
        if (!summary[record.subject]) {
          summary[record.subject] = {
            subject: record.subject,
            count: 0,
            dates: [],
            dutyLeaveCount: 0,
          };
        }
        summary[record.subject].count++;
        summary[record.subject].dates.push(record.date);
        if (record.dutyLeave) summary[record.subject].dutyLeaveCount++;
      });

      setSubjectSummary(
        Object.values(summary).sort((a, b) => b.count - a.count)
      );
    } catch (error: any) {
      console.error("Error fetching leave records:", error);
      setError(`Failed to fetch records: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLeaveAdded = () => {
    if (user) {
      fetchLeaveRecords(user.uid);
    }
  };

  const viewLeaveDetails = (subject: string) => {
    setSelectedSubject(subject);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteLeave = async (record: LeaveRecord) => {
    if (!db) return;
    if (!window.confirm("Are you sure you want to delete this leave record?"))
      return;
    try {
      await deleteDoc(doc(db, "leaves", record.id));
      fetchLeaveRecords(user.uid);
    } catch (error) {
      alert("Failed to delete leave record");
    }
  };

  const handleEditLeave = (record: LeaveRecord) => {
    setLeaveToEdit(record);
    setEditModalOpen(true);
  };

  const handleUpdateLeave = async (updated: LeaveRecord) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "leaves", updated.id), {
        subject: updated.subject,
        date: updated.date,
        period: updated.period,
        dutyLeave: updated.dutyLeave,
        reason: updated.reason,
      });
      setEditModalOpen(false);
      setLeaveToEdit(null);
      fetchLeaveRecords(user.uid);
    } catch (error) {
      alert("Failed to update leave record");
    }
  };

  // Calculate maximum leave count for progress bar scaling
  const maxLeaveCount =
    subjectSummary.length > 0
      ? Math.max(...subjectSummary.map((s) => s.count))
      : 0;

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
    <div className="min-h-screen bg-background relative">
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] z-0 opacity-60"></div>
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[120px] z-0 opacity-40"></div>

      {/* Mobile Navbar */}
      <nav className="sm:hidden flex items-center justify-between bg-card/80 backdrop-blur-md border-b border-primary/10 px-4 py-2 sticky top-0 z-20">
        {/* Title */}
        <span className="text-lg font-bold text-foreground heading-text">
          Leave Tracker
        </span>
        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="p-2 rounded-md hover:bg-destructive/10 focus:outline-none"
          aria-label="Sign Out"
        >
          <LogOut className="w-6 h-6 text-destructive" />
        </button>
      </nav>

      {/* Floating Action Button (FAB) for Add Leave on mobile */}
      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center text-3xl hover:bg-primary/90 focus:outline-none transition-all duration-200"
        aria-label="Add Leave"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Desktop Header */}
      <header className="hidden sm:block bg-card/30 backdrop-blur-md border-b border-primary/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 rounded bg-primary/20 border border-primary/30">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground heading-text">
                  Leave Tracker
                </h1>
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {user?.displayName}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Button
                  onClick={() => router.push("/admin")}
                  variant="outline"
                  className="gap-2 border-primary/20 hover:bg-primary/10"
                >
                  <Settings className="w-4 h-4 text-primary" />
                  ADMIN
                </Button>
              )}
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="gap-2 border-primary/20 hover:bg-primary/10"
              >
                <LogOut className="w-4 h-4 text-primary" />
                SIGN OUT
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-8 border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Add Button for Mobile */}
        {/* <div className="sm:hidden mb-4 flex w-full">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/80 button-glow"
          >
            <Plus className="h-4 w-4" />
            ADD LEAVE
          </Button>
        </div> */}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="card-dark border-primary/10 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Leaves
              </CardTitle>
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {leaveRecords.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {subjectSummary.length} subjects
              </p>
            </CardContent>
          </Card>

          <Card className="card-dark border-primary/10 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Most Leaves
              </CardTitle>
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {subjectSummary.length > 0
                  ? subjectSummary[0].subject
                  : "No data"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {subjectSummary.length > 0
                  ? `${subjectSummary[0].count} leaves recorded`
                  : "No leaves recorded"}
              </p>
            </CardContent>
          </Card>

          {/* Percentage Calculator Card */}
          <Card className="card-dark border-primary/10 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Percentage Calculator
              </CardTitle>
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                <PieChart className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground button-glow"
                onClick={() => setIsPercentageModalOpen(true)}
              >
                Calculate Percentage
              </Button>
              {percentageResult && (
                <div className="mt-4">
                  <div className="text-lg font-bold text-foreground">
                    {percentageSubject}: {percentageResult}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ({percentageTotal} total classes)
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile Segmented Control for Tabs */}
        <div className="sm:hidden mb-4 flex justify-center">
          <div className="max-w-full overflow-x-auto">
            <div className="inline-flex whitespace-nowrap rounded-lg bg-card border border-primary/10 shadow-sm overflow-hidden">
              <button
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 transition-colors focus:outline-none ${
                  activeTab === "subjects"
                    ? "bg-primary text-primary-foreground shadow"
                    : "bg-transparent text-foreground hover:bg-primary/10"
                }`}
                onClick={() => setActiveTab("subjects")}
                aria-pressed={activeTab === "subjects"}
                type="button"
              >
                <PieChart className="h-4 w-4" />
                Subjects
              </button>
              <button
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 transition-colors focus:outline-none ${
                  activeTab === "timeline"
                    ? "bg-primary text-primary-foreground shadow"
                    : "bg-transparent text-foreground hover:bg-primary/10"
                }`}
                onClick={() => setActiveTab("timeline")}
                aria-pressed={activeTab === "timeline"}
                type="button"
              >
                <Calendar className="h-4 w-4" />
                Timeline
              </button>
              <button
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 transition-colors focus:outline-none ${
                  activeTab === "dutyleave"
                    ? "bg-primary text-primary-foreground shadow"
                    : "bg-transparent text-foreground hover:bg-primary/10"
                }`}
                onClick={() => setActiveTab("dutyleave")}
                aria-pressed={activeTab === "dutyleave"}
                type="button"
              >
                <User className="h-4 w-4" />
                Duty Leave
              </button>
            </div>
          </div>
        </div>
        <Tabs
          defaultValue="subjects"
          className="mb-8"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="hidden sm:flex justify-between items-center mb-4">
            <TabsList className="bg-card/50 backdrop-blur-sm border border-primary/10">
              <TabsTrigger
                value="subjects"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
              >
                <PieChart className="h-4 w-4" />
                SUBJECTS
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
              >
                <Calendar className="h-4 w-4" />
                TIMELINE
              </TabsTrigger>
              <TabsTrigger
                value="dutyleave"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
              >
                <User className="h-4 w-4" />
                DUTY LEAVE
              </TabsTrigger>
            </TabsList>
            {/* Add button only on desktop */}
            <div className="hidden sm:block">
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/80 button-glow"
              >
                <Plus className="h-4 w-4" />
                ADD LEAVE
              </Button>
            </div>
          </div>

          <TabsContent value="subjects" className="mt-0">
            <Card className="card-dark border-primary/10">
              <CardHeader>
                <CardTitle className="heading-text text-lg">
                  SUBJECT OVERVIEW
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Overview of leaves taken by subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subjectSummary.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {subjectSummary.map((summary) => (
                      <Card
                        key={summary.subject}
                        className="relative bg-card/70 backdrop-blur-md border-0 shadow-xl rounded-2xl flex flex-col items-center px-0 pt-8 pb-4 overflow-hidden"
                      >
                        {/* Accent bar at the top */}
                        <div className="w-full h-2 bg-gradient-to-r from-primary via-fuchsia-500 to-blue-500 absolute top-0 left-0" />
                        {/* Gradient ring avatar */}
                        <div className="flex flex-col items-center w-full mb-2 z-10">
                          <div className="bg-gradient-to-tr from-primary via-fuchsia-500 to-blue-500 p-1 rounded-full ring-4 ring-primary/30">
                            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
                              <span className="text-3xl font-extrabold text-primary drop-shadow">
                                {summary.subject.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <CardTitle className="text-xl font-extrabold text-foreground tracking-wide uppercase text-center w-full mb-1 mt-1">
                          {summary.subject}
                        </CardTitle>
                        {/* Divider */}
                        <div className="w-2/3 h-px bg-gradient-to-r from-primary/40 via-fuchsia-400/30 to-blue-400/30 my-2 mx-auto" />
                        <CardContent className="flex flex-col items-center justify-center py-2 w-full">
                          <div className="flex flex-row items-center justify-center gap-6 w-full mt-2">
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-bold text-primary flex items-center gap-1">
                                <svg
                                  className="w-5 h-5 text-primary"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                {summary.count}
                              </span>
                              <span className="bg-primary/10 text-primary font-medium px-3 py-0.5 rounded-full text-xs mt-1 flex items-center gap-1">
                                Total
                              </span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-xl font-bold text-blue-500 flex items-center gap-1">
                                <svg
                                  className="w-5 h-5 text-blue-500"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                {summary.dutyLeaveCount}
                              </span>
                              <span className="bg-blue-500/10 text-blue-500 font-medium px-3 py-0.5 rounded-full text-xs mt-1 flex items-center gap-1">
                                Duty
                              </span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end w-full px-6 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-primary"
                            onClick={() => viewLeaveDetails(summary.subject)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="ml-1">Details</span>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-primary/10 rounded-lg bg-secondary/20">
                    No leave records found. Click "Add Leave" to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <Card className="card-dark border-primary/10">
              <CardHeader>
                <CardTitle className="heading-text text-lg">
                  LEAVE TIMELINE
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Chronological list of your leave records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaveRecords.length > 0 ? (
                  <div className="space-y-4">
                    {leaveRecords
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                      )
                      .map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between border-b border-primary/10 pb-3 group"
                        >
                          <div className="space-y-1">
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {record.subject}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(record.date).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge className="bg-primary/10 hover:bg-primary/20 text-primary border-0">
                            {record.subject}
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-primary/10 rounded-lg bg-secondary/20">
                    No leave records found. Click "Add Leave" to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dutyleave" className="mt-0">
            <Card className="card-dark border-primary/10">
              <CardHeader>
                <CardTitle className="heading-text text-lg">
                  DUTY LEAVE PERIODS
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  List of all periods lost which has duty leave
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaveRecords.filter((lr) => lr.dutyLeave).length > 0 ? (
                  <div className="space-y-4">
                    {leaveRecords
                      .filter((lr) => lr.dutyLeave)
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                      )
                      .map((record) => (
                        <div
                          key={record.id}
                          className="border border-primary/10 rounded-lg p-4 space-y-3 bg-secondary/30"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="font-medium text-foreground">
                                {record.subject}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(record.date).toLocaleDateString()}{" "}
                                {record.period && (
                                  <span className="ml-2">
                                    Period: {record.period}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge className="bg-blue-500/10 text-blue-500 border-0">
                              Duty Leave
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-primary/10">
                            <label className="flex-1">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploadingCertificate(record.id);
                                  setUploadProgress(0);
                                  try {
                                    // For now, create a data URL (in production, upload to Firebase Storage)
                                    const reader = new FileReader();
                                    reader.onprogress = (event) => {
                                      if (event.lengthComputable) {
                                        const percentComplete =
                                          (event.loaded / event.total) * 100;
                                        setUploadProgress(percentComplete);
                                      }
                                    };
                                    reader.onload = async (event) => {
                                      setUploadProgress(100);
                                      const dataUrl = event.target
                                        ?.result as string;
                                      await updateDoc(
                                        doc(db, "leaves", record.id),
                                        {
                                          certificateUrl: dataUrl,
                                        }
                                      );
                                      await fetchLeaveRecords(user.uid);
                                      toast.success(
                                        "Certificate uploaded successfully!"
                                      );
                                    };
                                    reader.readAsDataURL(file);
                                  } catch (error) {
                                    console.error(
                                      "Error uploading certificate:",
                                      error
                                    );
                                    toast.error("Failed to upload certificate");
                                  } finally {
                                    setUploadingCertificate(null);
                                    setUploadProgress(0);
                                  }
                                }}
                                className="hidden"
                                disabled={uploadingCertificate === record.id}
                              />
                              <div className="space-y-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full sm:w-auto border-primary/30 hover:bg-primary/10 cursor-pointer"
                                  disabled={uploadingCertificate === record.id}
                                  onClick={(e) => {
                                    const input =
                                      e.currentTarget.parentElement?.parentElement?.querySelector(
                                        'input[type="file"]'
                                      ) as HTMLInputElement;
                                    input?.click();
                                  }}
                                >
                                  {uploadingCertificate === record.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      📄{" "}
                                      {record.certificateUrl
                                        ? "Update"
                                        : "Upload"}{" "}
                                      Duty Leave
                                    </>
                                  )}
                                </Button>
                                {uploadingCertificate === record.id && (
                                  <div className="space-y-1">
                                    <Progress
                                      value={uploadProgress}
                                      className="h-2"
                                    />
                                    <p className="text-xs text-muted-foreground text-center">
                                      {Math.round(uploadProgress)}%
                                    </p>
                                  </div>
                                )}
                              </div>
                            </label>
                            {record.certificateUrl && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-primary/30 hover:bg-primary/10"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = record.certificateUrl!;
                                  link.download = `${record.subject}_${record.date}_duty_leave`;
                                  link.click();
                                  toast.success("Duty Leave downloaded!");
                                }}
                              >
                                ⬇️ Download Duty Leave
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-primary/10 rounded-lg bg-secondary/20">
                    No duty leave records found.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Leave Modal */}
      <AddLeaveModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLeaveAdded={handleLeaveAdded}
      />

      {/* Leave Details Modal */}
      {selectedSubject && (
        <LeaveDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          subject={selectedSubject}
          leaveRecords={leaveRecords.filter(
            (record) => record.subject === selectedSubject
          )}
          onEdit={handleEditLeave}
          onDelete={handleDeleteLeave}
        />
      )}

      {leaveToEdit && (
        <AddLeaveModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setLeaveToEdit(null);
          }}
          onLeaveAdded={() => fetchLeaveRecords(user.uid)}
          editRecord={leaveToEdit}
          onUpdate={handleUpdateLeave}
        />
      )}

      {/* Percentage Modal */}
      <PercentageModal
        isOpen={isPercentageModalOpen}
        onClose={() => setIsPercentageModalOpen(false)}
        subjects={allSubjects}
        onCalculate={(subjectId, totalClasses, setResult) => {
          const subj = leaveRecords.filter(
            (lr) =>
              lr.subject === allSubjects.find((s) => s.id === subjectId)?.name
          );
          if (!totalClasses || totalClasses <= 0) {
            setResult("N/A");
            return;
          }
          const attendance =
            (((totalClasses - subj.length) / totalClasses) * 100).toFixed(2) +
            "%";
          setResult(attendance);
        }}
      />
    </div>
  );
}
