'use client';

import { CloudSync, FileText, Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { StarGroupList } from '@/components/star-group';
import { StarGroup, StarItem } from '@/lib/types';
import { StarItemRow } from '@/components/star-item';
import { useState } from 'react';
import { AddItemModal } from './add-item-modal';
import { EditItemModal } from './edit-item-modal';
import { RawDataModal } from './raw-data-modal';
import { DropdownMenu } from './dropdown-menu';
import { SyncModal } from './sync-modal';


export function StarList() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [items, setItems] = useState<StarItem[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const storedItems = localStorage.getItem('starItems');
    return storedItems ? JSON.parse(storedItems) : [];
  });
  const [groups, setGroups] = useState<StarGroup[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const storedGroups = localStorage.getItem('starGroups');
    return storedGroups ? JSON.parse(storedGroups) : [];
  });
  const [showRawDataModal, setShowRawDataModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StarItem>({
    id: '',
    name: '',
    groupId: '',
    price: 0,
    notes: '',
    links: [],
    priority: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  function generateId(existingIds: Set<string>): string {
    let newId: string;
    do {
      newId = crypto.randomUUID();
    } while (existingIds.has(newId));
    return newId;
  }

  function addItem(newItem: StarItem): string {
    const existingIndex = items.findIndex((i) => i.id === newItem.id);
    if (existingIndex !== -1) {
      const updatedItems = items.map((item, idx) => (idx === existingIndex ? newItem : item));
      localStorage.setItem('starItems', JSON.stringify(updatedItems));
      setItems(updatedItems);
      return newItem.id;
    }
    newItem.id = generateId(new Set(items.map(i => i.id)));
    localStorage.setItem('starItems', JSON.stringify([...items, newItem]));
    setItems((prev) => [...prev, newItem]);
    return newItem.id;
  }

  function deleteItem(itemId: string): void {
    const updatedItems = items.filter((i) => i.id !== itemId);
    localStorage.setItem('starItems', JSON.stringify(updatedItems));
    setItems(updatedItems);
  }

  function addGroup(groupName: string): string | undefined {
    const parts = groupName.split('>').map(part => part.trim()).filter(part => part !== '');
    if (parts.length === 0) return undefined;
    
    let parentId: string | undefined;
    let leafId: string | undefined;
    const newGroups: StarGroup[] = [];
    parts.forEach((part) => {
      const existingGroup = groups.find((g) => g.name === part && g.parentId === parentId);
      if (existingGroup) {
        leafId = existingGroup.id;
      } else {
        const newGroup: StarGroup = {
          id: generateId(new Set(groups.map(g => g.id))),
          name: part,
          createdAt: new Date(),
          updatedAt: new Date(),
          parentId,
        };
        newGroups.push(newGroup);
        leafId = newGroup.id;
      }
      parentId = leafId;
    });
    localStorage.setItem('starGroups', JSON.stringify([...groups, ...newGroups]));
    setGroups((prev) => [...prev, ...newGroups]);
    return leafId;
  }

  function handleItemClick(item: StarItem) {
    if (items.some((i) => i.id === item.id)) {
      setSelectedItem(item);
      setShowEditModal(true);
    }
  }

  function resetData() {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      localStorage.removeItem('starItems');
      localStorage.removeItem('starGroups');
      setItems([]);
      setGroups([]);
    }
  }

  function setData(newItems: StarItem[], newGroups: StarGroup[]) {
    localStorage.setItem('starItems', JSON.stringify(newItems));
    localStorage.setItem('starGroups', JSON.stringify(newGroups));
    setItems(newItems);
    setGroups(newGroups);
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

        <div className="flex justify-between gap-3 mb-6 flex-wrap items-center">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
          
          <div className="flex gap-2">
            <Button key="sync" variant="outline" onClick={() => setShowSyncModal(true)}>
              <CloudSync className="w-4 h-4 mr-2" />
              Sync
            </Button>
            <DropdownMenu nodes={[
              <Button key="raw-data" variant="ghost" onClick={() => setShowRawDataModal(true)} className="w-full text-left flex justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Raw Data
              </Button>
            ]} />
          </div>
        </div>

        <div className="space-y-5">
          {rootItems.length === 0 && rootGroups.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              No starred items yet. Click the &quot;Add Item&quot; button to get started!
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
                  <StarItemRow key={item.id} item={item} handleClick={handleItemClick} />
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
              handleItemClick={handleItemClick}
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

      <EditItemModal
        key={selectedItem.id || 'edit-empty'}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        item={selectedItem}
        addItem={addItem}
        deleteItem={deleteItem}
      />

      <RawDataModal
        open={showRawDataModal}
        items={items}
        groups={groups}
        onOpenChange={setShowRawDataModal}
        resetData={resetData}
        setData={setData}
      />

      <SyncModal
        open={showSyncModal}
        onOpenChange={setShowSyncModal}
        items={items}
        groups={groups}
        setData={setData}
      />
    </div>
  );
}
