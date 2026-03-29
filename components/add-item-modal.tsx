'use client';

import { Dot, Trash, X } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { Link, StarItem } from "@/lib/types";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addItem: (newItem: StarItem, index?: number) => string;
  addGroup: (groupStr: string, parentId?: string) => string | undefined;
}

export function AddItemModal({ open, onOpenChange, addItem, addGroup }: AddItemModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [group, setGroup] = useState('');
  const [priority, setPriority] = useState(3);
  const [notes, setNotes] = useState('');
  const [linkInputs, setLinkInputs] = useState<Link[]>([{ url: '', label: '', price: undefined }]);

  function handleLinkChange(index: number, field: keyof Link, value: string | number | undefined): void {
    setLinkInputs((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  }

  function handleClear() {
    setName('');
    setPrice('');
    setGroup('');
    setPriority(3);
    setNotes('');
    setLinkInputs([{ url: '', label: '' }]);
  }

  function handleSave() {
    if (!name.trim()) {
      alert('Name is required');
      return;
    }
    if (priority < 1 || priority > 5) {
      alert('Priority must be between 1 and 5');
      return;
    }
    const validLinks = linkInputs.filter(link => link.url.trim() !== '');
    const groupId = addGroup(group);

    const newItem: StarItem = {
      id: crypto.randomUUID(),
      name,
      groupId,
      price: typeof price === 'number' ? price : 0,
      notes,
      links: validLinks,
      priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addItem(newItem);

    handleClear();
    onOpenChange(false);
  }

  return (
    <div>
      {open && (
        <div className="fixed inset-0 bg-card/50 backdrop-blur-xs flex items-center justify-center z-50" onClick={() => onOpenChange(false)}>
          <div className="space-y-8 bg-background rounded-lg px-4 py-2 w-full max-w-2xl border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-2 mb-2">
              <h2 className="font-semibold text-lg">Add Item</h2>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="w-10 h-10 p-2">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form className="space-y-4 overflow-y-auto max-h-[80vh] px-6">
              <div>
                <label htmlFor="item-name" className="block text-sm font-medium mb-1 text-muted-foreground">Name</label>
                <input id="item-name" type="text" placeholder="Standing Desk" required className="border border-border rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-ring" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label htmlFor="item-price" className="block text-sm font-medium mb-1 text-muted-foreground">Price</label>
                <input id="item-price" type="number" placeholder="10.000" min={0} required className="border border-border rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-ring" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
              </div>

              <div>
                <label htmlFor="item-group" className="block text-sm font-medium mb-1 text-muted-foreground">Group</label>
                <input id="item-group" type="text" placeholder="Group A &gt; Group B" className="border border-border rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-ring" value={group} onChange={(e) => setGroup(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1 italic">Use &gt; to indicate subgroup (e.g. &quot;Group A &gt; Group B&quot;).</p>
              </div>

              <div>
                <label htmlFor="item-priority" className="block text-sm font-medium mb-1 text-muted-foreground">Priority</label>
                <div className="flex items-center gap-4">
                  <span>1</span>
                  <input id="item-priority" type="range" min="1" max="5" list="markers" className="w-full accent-foreground focus:outline-none" value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
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
                <div id="item-links" className="space-y-4">
                  {linkInputs.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Dot className="w-4 h-4 text-muted-foreground" strokeWidth={4} />
                      <div className="flex flex-col w-full gap-2 border border-border rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <input type="url" placeholder="https://example.com/" className="border-b-2 border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-ring grow" value={link.url} onChange={(e) => handleLinkChange(index, 'url', e.target.value)} />
                          {linkInputs.length > 1 && (
                            <Button variant="destructive" size="icon" className="w-10 h-10 p-2" onClick={() => setLinkInputs(linkInputs.filter((_, i) => i !== index))}>
                              <Trash className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <input type="text" placeholder="Optional label" className="border-b-2 border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-ring grow" value={link.label} onChange={(e) => handleLinkChange(index, 'label', e.target.value)} />
                          <input type="number" placeholder="Optional price" className="border-b-2 border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-ring grow" value={link.price || ''} onChange={(e) => handleLinkChange(index, 'price', Number(e.target.value))} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setLinkInputs([...linkInputs, { url: '', label: '' }])}>
                    Add Link
                  </Button>
                </div>
              </div>

              <div>
                <label htmlFor="item-notes" className="block text-sm font-medium mb-1 text-muted-foreground">Notes</label>
                <textarea id="item-notes" placeholder="Steel legs, 60-120 cm adjustable height" rows={4} className="border border-border rounded-lg p-2 w-full resize-none focus:outline-none focus:ring-2 focus:ring-ring" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </form>

            <div className="sticky bottom-0 bg-background p-2 border-t border-border flex justify-between gap-4">
              <div>
                <Button variant="secondary" onClick={handleClear}>
                  Clear
                </Button>
              </div>
              <div className="flex justify-end items-center gap-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Item
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
