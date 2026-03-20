"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface RawDataModalProps {
  open: boolean;
  items: any;
  groups: any;
  onOpenChange: (open: boolean) => void;
  resetData: () => void;
}

export function RawDataModal({ open, items, groups, onOpenChange, resetData }: RawDataModalProps) {

  function handleReset() {
    resetData();
    onOpenChange(false);
  }

  return (
    <div>
      {open && (
        <div className="fixed inset-0 bg-card/50 backdrop-blur-xs flex items-center justify-center z-50" onClick={() => onOpenChange(false)}>
          <div className="bg-background rounded-lg px-4 py-2 w-full max-w-2xl border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-2">
              <h2 className="font-semibold text-lg">Raw Data</h2>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="w-10 h-10 p-2">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[60vh] p-2">
              <div>
                <h3 className="font-semibold mb-1">Star Items</h3>
                <pre className="whitespace-pre-wrap wrap-break-words">{JSON.stringify(items, null, 2)}</pre>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Star Groups</h3>
                <pre className="whitespace-pre-wrap wrap-break-words">{JSON.stringify(groups, null, 2)}</pre>
              </div>
            </div>

            <div className="sticky bottom-0 bg-background p-2 border-t border-border flex justify-between gap-4">
              <div>
                <Button variant="destructive" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}