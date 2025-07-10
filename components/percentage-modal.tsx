"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Subject {
  id: string;
  name: string;
}

interface PercentageModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onCalculate: (
    subjectId: string,
    totalClasses: number,
    setResult: (percent: string) => void
  ) => void;
  loading?: boolean;
}

export function PercentageModal({
  isOpen,
  onClose,
  subjects,
  onCalculate,
  loading = false,
}: PercentageModalProps) {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [totalClasses, setTotalClasses] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedSubject ||
      !totalClasses ||
      isNaN(Number(totalClasses)) ||
      Number(totalClasses) <= 0
    )
      return;
    onCalculate(selectedSubject, Number(totalClasses), (percent: string) => {
      setResult(percent);
    });
  };

  const handleClose = () => {
    setSelectedSubject("");
    setTotalClasses("");
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-xs sm:max-w-md card-dark border-primary/30 backdrop-blur-sm p-4 sm:p-6 pt-8">
        <DialogHeader>
          <DialogTitle className="heading-text text-xl text-foreground">
            Percentage Calculator
          </DialogTitle>
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
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="totalClasses"
              className="text-sm uppercase tracking-wider text-muted-foreground"
            >
              Total Classes <span className="text-primary">*</span>
            </Label>
            <Input
              id="totalClasses"
              type="number"
              min={1}
              value={totalClasses}
              onChange={(e) => setTotalClasses(e.target.value)}
              placeholder="Enter total classes"
              className="bg-secondary border-primary/30 focus:ring-primary"
              required
            />
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
              disabled={loading || !selectedSubject || !totalClasses}
              className="bg-primary hover:bg-primary/80 button-glow w-full sm:w-auto"
            >
              CALCULATE
            </Button>
          </DialogFooter>
        </form>
        {result && (
          <div className="mt-4 text-center">
            <div className="text-lg font-bold text-foreground">{result}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Attendance percentage for selected subject
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
