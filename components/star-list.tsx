'use client';

import { Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { StarGroupList } from '@/components/star-group';
import { StarGroup, StarItem } from '@/lib/types';
import { StarItemRow } from '@/components/star-item';


export function StarList() {
  const dummyGroups: StarGroup[] = [
    {
      id: '1',
      name: 'Group 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Group 2',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: '1',
    },
    {
      id: '3',
      name: 'Group 3',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      name: 'Group 4',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: '3',
    },
  ];
  const dummyItems: StarItem[] = [
    {
      id: '1',
      name: 'Item 1',
      price: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: 'This is a note for Item 1.\nIt can have multiple lines.',
      links: [{ url: 'https://example.com/item1', label: 'Example Link' }, { url: 'https://example.com/item1-2' }, { url: 'https://example.com/item1-3' }],
      priority: 3,
    },
    {
      id: '2',
      name: 'Item 2',
      price: 200,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: 'This is a note for Item 2.\nIt can have multiple lines.',
      links: [],
      priority: 2,
      groupId: '1',
    },
    {
      id: '3',
      name: 'Item 3',
      price: 300,
      createdAt: new Date(),
      updatedAt: new Date(),
      links: [{ url: 'https://example.com/item3' }],
      priority: 1,
      groupId: '2',
    },
    {
      id: '4',
      name: 'Item 4',
      price: 400,
      createdAt: new Date(),
      updatedAt: new Date(),
      links: [],
      priority: 4,
      groupId: '1',
    },
    {
      id: '5',
      name: 'Item 5',
      price: 500,
      createdAt: new Date(),
      updatedAt: new Date(),
      links: [],
      priority: 5,
      groupId: '4',
    }
  ];

  const groupedItems = new Map<string, StarItem[]>();
  dummyItems.forEach((item) => {
    let currentGroupId = item.groupId;
    while (currentGroupId) {
      const group = dummyGroups.find((g) => g.id === currentGroupId);
      if (group && group.parentId) {
        currentGroupId = group.parentId;
        console.log(`Group found: ${group.name} with parentId: ${group.parentId}`);
      } else {
        console.warn(`Group with id ${currentGroupId} not found for item ${item.name}`);
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

  const rootGroups = dummyGroups.filter((g) => !g.parentId);
  const rootItems = dummyItems
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
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-5">
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
              subgroups={dummyGroups.filter((g) => g.parentId === group.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
