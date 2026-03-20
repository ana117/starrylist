'use client';

import { Dot, Trash, X } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { Link, StarItem } from "@/lib/types";

interface EditItemModalProps {
  open: boolean;
  item: StarItem;
  index: number;
  onOpenChange: (open: boolean) => void;
  addItem: (newItem: StarItem, index?: number) => string;
  deleteItem: (itemId: string) => void;
  addGroup: (groupStr: string, parentId?: string) => string | undefined;
}

export function EditItemModal({ open, item, index, onOpenChange, addItem, deleteItem, addGroup }: EditItemModalProps) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState<number | ''>(item.price);
  const [priority, setPriority] = useState(item.priority);
  const [notes, setNotes] = useState(item.notes);
  const [linkInputs, setLinkInputs] = useState<Link[]>(item.links.length > 0 ? item.links : [{ url: '', label: '' }]);

  useEffect(() => {
    if (!open) return;

    setName(item.name);
    setPrice(item.price);
    setPriority(item.priority);
    setNotes(item.notes ?? '');
    setLinkInputs(item.links.length > 0 ? item.links : [{ url: '', label: '' }]);
  }, [open, item]);

  function handleLinkChange(index: number, field: keyof Link, value: string): void {
    setLinkInputs((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
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
    const groupId = item.groupId;

    const newItem: StarItem = {
      id: item.id,
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
    onOpenChange(false);
  }

  function handleDelete() {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItem(item.id);
      onOpenChange(false);
    }
  }

  return (
    <div>
      {open && (
        <div className="fixed inset-0 bg-card/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="space-y-8 bg-background rounded-lg px-4 py-2 w-full max-w-2xl border border-border">
            <div className="flex justify-between items-center p-2 mb-2">
              <h2 className="font-semibold text-lg">Edit Item</h2>
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
                <div id="item-links" className="space-y-2">
                  {linkInputs.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Dot className="w-4 h-4 text-muted-foreground" strokeWidth={4} />
                      <input type="url" placeholder="https://example.com/" className="border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-ring grow" value={link.url} onChange={(e) => handleLinkChange(index, 'url', e.target.value)} />
                      <input type="text" placeholder="Optional label" className="border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-ring" value={link.label} onChange={(e) => handleLinkChange(index, 'label', e.target.value)} />
                      {linkInputs.length > 1 && (
                        <Button variant="destructive" size="icon" className="w-10 h-10 p-2" onClick={() => setLinkInputs(linkInputs.filter((_, i) => i !== index))}>
                          <Trash className="w-4 h-4" />
                        </Button>
                      )}
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
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
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
