"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { StarGroup, StarItem } from "@/lib/types";

interface RawDataModalProps {
  open: boolean;
  items: StarItem[];
  groups: StarGroup[];
  onOpenChange: (open: boolean) => void;
  resetData: () => void;
  setData: (newItems: StarItem[], newGroups: StarGroup[]) => void;
}

export function RawDataModal({ open, items, groups, onOpenChange, resetData, setData }: RawDataModalProps) {
  const [showImportInput, setShowImportInput] = useState(false);

  function handleReset() {
    resetData();
    onOpenChange(false);
  }

  function handleExport() {
      const dataStr = JSON.stringify({ items, groups }, null, 2);
      navigator.clipboard.writeText(dataStr).then(() => {
        alert("Data copied to clipboard!");
      }).catch((err) => {
        alert("Failed to copy data: " + err);
      });
  }

  function handleImport() {
    const textarea = document.querySelector("textarea");
    if (textarea) {
      const jsonData = textarea.value;
      try {
        const parsedData = JSON.parse(jsonData);
        const parsedItems = Array.isArray(parsedData?.items) ? parsedData.items : [];
        const parsedGroups = Array.isArray(parsedData?.groups) ? parsedData.groups : [];
        setData(parsedItems, parsedGroups);
        onOpenChange(false);
        setShowImportInput(false);
      } catch {
        alert("Invalid JSON data");
      }
    }
  }

  return (
    <div>
      {open && (
        <div className="fixed inset-0 bg-card/50 backdrop-blur-xs flex items-center justify-center z-50" onClick={() => onOpenChange(false)}>
          <div className="bg-background rounded-lg px-4 py-2 w-full max-w-2xl border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-2">
              <h2 className="font-semibold text-lg">
                {showImportInput ? "Import Data" : "Raw Data"}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="w-10 h-10 p-2">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {showImportInput ? (
              <div className="mb-4">
                <textarea className="w-full h-[60vh] p-2 border border-border rounded" placeholder="Paste your JSON data here..."></textarea>
              </div>
            ) : (
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
            )}

            <div className="sticky bottom-0 bg-background p-2 border-t border-border">
              {showImportInput ? (
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="outline" onClick={() => setShowImportInput(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleImport()}>
                    Import
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between gap-4">
                  <div>
                    <Button variant="destructive" onClick={handleReset}>
                      Reset
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowImportInput(!showImportInput)}>
                      Import
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                      Export
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}