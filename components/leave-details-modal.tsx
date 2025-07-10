"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LeaveRecord {
  id: string;
  subject: string;
  date: string;
  period?: string;
  dutyLeave?: boolean;
  reason?: string;
}

interface LeaveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  leaveRecords: LeaveRecord[];
  onEdit?: (record: LeaveRecord) => void;
  onDelete?: (record: LeaveRecord) => void;
}

export function LeaveDetailsModal({
  isOpen,
  onClose,
  subject,
  leaveRecords,
  onEdit,
  onDelete,
}: LeaveDetailsModalProps) {
  const sortedRecords = leaveRecords.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] card-dark border-primary/30 backdrop-blur-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle className="heading-text text-xl">
              {subject}
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            All leave records for this subject ({leaveRecords.length} total)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {sortedRecords.map((record) => (
              <Card
                key={record.id}
                className="bg-secondary/50 border-primary/20 overflow-hidden"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge
                      variant="outline"
                      className="bg-primary/10 border-primary/30 text-primary"
                    >
                      {format(new Date(record.date), "MMM dd, yyyy")}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-secondary text-muted-foreground"
                    >
                      {format(new Date(record.date), "EEEE")}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {record.period && (
                      <Badge
                        variant="outline"
                        className="border-primary/30 text-primary"
                      >
                        Period: {record.period}
                      </Badge>
                    )}
                    {typeof record.dutyLeave === "boolean" && (
                      <Badge
                        variant="outline"
                        className={
                          record.dutyLeave
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-secondary/30 text-muted-foreground border-primary/30"
                        }
                      >
                        {record.dutyLeave ? "Duty Leave" : "Not Duty Leave"}
                      </Badge>
                    )}
                  </div>
                  {record.reason && (
                    <div className="flex items-start gap-2 mt-2 border-t border-primary/10 pt-2">
                      <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        {record.reason}
                      </p>
                    </div>
                  )}
                  {/* Edit/Delete Buttons */}
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      className="px-3 py-1 rounded bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition"
                      onClick={() => onEdit && onEdit(record)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition"
                      onClick={() => onDelete && onDelete(record)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {sortedRecords.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No leave records found for this subject.
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
