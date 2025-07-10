"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface AddLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeaveAdded: () => void;
  editRecord?: any;
  onUpdate?: (updated: any) => void;
}

interface Subject {
  id: string;
  name: string;
}

export function AddLeaveModal({
  isOpen,
  onClose,
  onLeaveAdded,
  editRecord,
  onUpdate,
}: AddLeaveModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [period, setPeriod] = useState<string>("");
  const [dutyLeave, setDutyLeave] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSubjects();
      if (editRecord) {
        setSelectedSubject(editRecord.subject || "");
        setSelectedDate(editRecord.date ? new Date(editRecord.date) : undefined);
        setReason(editRecord.reason || "");
        setPeriod(editRecord.period || "");
        setDutyLeave(editRecord.dutyLeave === true ? "yes" : editRecord.dutyLeave === false ? "no" : "");
      } else {
        setSelectedSubject("");
        setSelectedDate(undefined);
        setReason("");
        setPeriod("");
        setDutyLeave("");
      }
    }
  }, [isOpen, editRecord]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubject || !selectedDate || !period || !dutyLeave) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!auth.currentUser) {
      toast.error("You must be logged in to add leave records");
      return;
    }

    setLoading(true);

    try {
      if (editRecord && onUpdate) {
        await onUpdate({
          ...editRecord,
          subject: selectedSubject,
          date: format(selectedDate, "yyyy-MM-dd"),
          period,
          dutyLeave: dutyLeave === "yes",
          reason: reason.trim(),
        });
        toast.success("Leave record updated successfully");
      } else {
        await addDoc(collection(db, "leaves"), {
          userId: auth.currentUser.uid,
          subject: selectedSubject,
          date: format(selectedDate, "yyyy-MM-dd"),
          period: period,
          dutyLeave: dutyLeave === "yes",
          reason: reason.trim(),
          createdAt: new Date().toISOString(),
        });
        toast.success("Leave record added successfully");
        onLeaveAdded();
      }
      handleClose();
    } catch (error) {
      console.error("Error saving leave record:", error);
      toast.error("Failed to save leave record");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedSubject("");
    setSelectedDate(undefined);
    setReason("");
    setPeriod("");
    setDutyLeave("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-xs sm:max-w-md card-dark border-primary/30 backdrop-blur-sm p-4 sm:p-6 pt-8">
        <DialogHeader>
          <DialogTitle className="heading-text text-xl text-foreground">
            {editRecord ? "EDIT LEAVE RECORD" : "ADD LEAVE RECORD"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editRecord ? "Update the details for this leave entry" : "Record a new leave entry with subject and date details"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label
              htmlFor="subject"
              className="text-sm uppercase tracking-wider text-muted-foreground"
            >
              Subject <span className="text-primary">*</span>
            </Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full bg-secondary border-primary/30 focus:ring-primary">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary/30">
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.name}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period Dropdown */}
          <div className="space-y-2">
            <Label
              htmlFor="period"
              className="text-sm uppercase tracking-wider text-muted-foreground"
            >
              Period <span className="text-primary">*</span>
            </Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full bg-secondary border-primary/30 focus:ring-primary">
                <SelectValue placeholder="Select period (1-6)" />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary/30">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    Period {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm uppercase tracking-wider text-muted-foreground">
              Date <span className="text-primary">*</span>
            </Label>
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-secondary border-primary/30 hover:bg-secondary/80"
                  onClick={() => setDatePopoverOpen(true)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 bg-card border-primary/30"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) setDatePopoverOpen(false);
                  }}
                  initialFocus
                  className="bg-card"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="reason"
              className="text-sm uppercase tracking-wider text-muted-foreground"
            >
              Reason (Optional)
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for leave (optional)"
              className="resize-none bg-secondary border-primary/30 focus:ring-primary"
              rows={3}
            />
          </div>

          {/* Duty Leave Question */}
          <div className="space-y-2">
            <Label
              htmlFor="dutyLeave"
              className="text-sm uppercase tracking-wider text-muted-foreground"
            >
              Can duty leave be availed? <span className="text-primary">*</span>
            </Label>
            <Select value={dutyLeave} onValueChange={setDutyLeave}>
              <SelectTrigger className="w-full bg-secondary border-primary/30 focus:ring-primary">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary/30">
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-primary/30 hover:bg-secondary/80 w-full sm:w-auto"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedSubject || !selectedDate || !period || !dutyLeave}
              className="bg-primary hover:bg-primary/80 button-glow w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ADDING...
                </>
              ) : (
                "ADD LEAVE"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
