'use client';

import { Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { StarGroupList } from '@/components/star-group';
import { StarGroup, StarItem } from '@/lib/types';
import { StarItemRow } from '@/components/star-item';
import { useState } from 'react';
import { AddItemModal } from './add-item-modal';


export function StarList() {
  const [showAddModal, setShowAddModal] = useState(false);
  
  const items: StarItem[] = [];
  const groups: StarGroup[] = [];

  if (typeof window !== 'undefined') {
    const storedItems = localStorage.getItem('starItems');
    const storedGroups = localStorage.getItem('starGroups');

    if (storedItems) {
      JSON.parse(storedItems).forEach((item: any) => {
        items.push({
          ...item,
        });
      });
    }
    if (storedGroups) {
      JSON.parse(storedGroups).forEach((group: any) => {
        groups.push({
          ...group,
        });
      });
    }
  }

  function addItem(newItem: StarItem, index?: number): string {
    if (index !== undefined) {
      const updatedItems = [...items];
      updatedItems.splice(index, 0, newItem);
      localStorage.setItem('starItems', JSON.stringify(updatedItems));
      return newItem.id;
    }
    const updatedItems = [...items, newItem];
    localStorage.setItem('starItems', JSON.stringify(updatedItems));
    return newItem.id;
  }
  function addGroup(groupName: string, parentId?: string): string | undefined {
    if (groups.some((g) => g.name === groupName)) {
      return groups.find((g) => g.name === groupName)?.id;
    }
    const newGroup: StarGroup = {
      id: crypto.randomUUID(),
      name: groupName,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId,
    };
    const updatedGroups = [...groups, newGroup];
    localStorage.setItem('starGroups', JSON.stringify(updatedGroups));
    return newGroup.id;
  }

  const groupedItems = new Map<string, StarItem[]>();
  items.forEach((item) => {
    let currentGroupId = item.groupId;
    while (currentGroupId) {
      const group = groups.find((g) => g.id === currentGroupId);
      if (group && group.parentId) {
        currentGroupId = group.parentId;
      } else {
        break;
      }
    }

    if (currentGroupId) {
      if (!groupedItems.has(currentGroupId)) {
        groupedItems.set(currentGroupId, []);
      }
      groupedItems.get(currentGroupId)!.push(item);
    }
  });

  const rootGroups = groups.filter((g) => !g.parentId);
  const rootItems = items
    .filter((item) => !item.groupId)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
 
  const totalPrice = rootItems.reduce((sum, item) => sum + (item.price || 0), 0);
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Star strokeWidth={4} /> StarryList
          </h1>
          <ModeToggle />
        </div>

        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-5">
          {rootItems.length === 0 && rootGroups.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              No starred items yet. Click the "Add Item" button to get started!
            </div>
          )}

          {rootItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2">
                <h2 className="text-muted-foreground font-semibold">
                  Uncategorized
                </h2>
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-3">
                  {totalPrice > 0 && (
                    <span>
                      {new Intl.NumberFormat('en-ID', {
                        style: 'currency',
                        currency: 'IDR',
                      }).format(totalPrice)}
                    </span>
                  )}
                  {rootItems.length} {rootItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="ml-4 space-y-2">
                {rootItems.map((item) => (
                  <StarItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {rootGroups.map((group) => (
            <StarGroupList
              key={group.id}
              group={group}
              items={groupedItems.get(group.id) || []}
              subgroups={groups.filter((g) => g.parentId === group.id)}
            />
          ))}
        </div>
      </div>

      <AddItemModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        addItem={addItem}
        addGroup={addGroup}
      />
    </div>
  );
}
