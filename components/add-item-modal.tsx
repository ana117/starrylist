'use client';

import { Dot, Trash, X } from "lucide-react";
import { Button } from "./ui/button";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddItemModal({ open, onOpenChange }: AddItemModalProps) {
  return (
    <div>
      {open && (
        <div className="fixed inset-0 bg-card/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="space-y-8 bg-background rounded-lg px-4 py-2 w-full max-w-2xl border border-border">
            <div className="flex justify-between items-center p-2 mb-2">
              <h2 className="font-semibold text-lg">Add Item</h2>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="w-10 h-10 p-2">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[80vh] px-2">
              <div>
                <label htmlFor="item-name" className="block text-sm font-medium mb-1 text-muted-foreground">Name</label>
                <input id="item-name" type="text" placeholder="Standing Desk" required className="border border-border rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div>
                <label htmlFor="item-price" className="block text-sm font-medium mb-1 text-muted-foreground">Price</label>
                <input id="item-price" type="number" placeholder="10.000" min={0} required className="border border-border rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div>
                <label htmlFor="item-group" className="block text-sm font-medium mb-1 text-muted-foreground">Group</label>
                <input id="item-group" type="text" placeholder="Group A &gt; Group B" className="border border-border rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-ring" />
                <p className="text-xs text-muted-foreground mt-1 italic">Use &gt; to indicate subgroup (e.g. &quot;Group A &gt; Group B&quot;).</p>
              </div>

              <div>
                <label htmlFor="item-priority" className="block text-sm font-medium mb-1 text-muted-foreground">Priority</label>
                <div className="flex items-center gap-4">
                  <span>1</span>
                  <input id="item-priority" type="range" min="1" max="5" list="markers" className="w-full accent-foreground focus:outline-none" />
                  <span>5</span>
                </div>
                <datalist id="markers">
                  <option value="1"></option>
                  <option value="2"></option>
                  <option value="3"></option>
                  <option value="4"></option>
                  <option value="5"></option>
                </datalist>
              </div>

              <div>
                <label htmlFor="item-links" className="block text-sm font-medium mb-1 text-muted-foreground">Links</label>
                <div id="item-links" className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Dot className="w-4 h-4 text-muted-foreground" strokeWidth={4} />
                    <input type="url" placeholder="https://example.com/" className="border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-ring grow" />
                    <input type="text" placeholder="Optional label" className="border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-ring" />
                    <Button variant="destructive" size="icon" className="w-10 h-10 p-2">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dot className="w-4 h-4 text-muted-foreground" strokeWidth={4} />
                    <input type="url" placeholder="https://example.com/" className="border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-ring grow" />
                    <input type="text" placeholder="Optional label" className="border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-ring" />
                    <Button variant="destructive" size="icon" className="w-10 h-10 p-2">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm">
                    Add Link
                  </Button>
                </div>
              </div>

              <div>
                <label htmlFor="item-notes" className="block text-sm font-medium mb-1 text-muted-foreground">Notes</label>
                <textarea id="item-notes" placeholder="Steel legs, 60-120 cm adjustable height" rows={4} className="border border-border rounded-lg p-2 w-full resize-none focus:outline-none focus:ring-2 focus:ring-ring"></textarea>
              </div>
            </div>

            <div className="sticky bottom-0 bg-background p-2 border-t border-border flex justify-end gap-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button>
                Save Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
