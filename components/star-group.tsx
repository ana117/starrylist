'use client';

import { StarGroup, StarItem } from "@/lib/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { StarItemRow } from "@/components/star-item";

interface StarGroupProps {
  group: StarGroup;
  items: StarItem[];
  subgroups: StarGroup[];
  handleItemClick: (item: StarItem) => void;
}

export function StarGroupList({ group, items, subgroups, handleItemClick }: StarGroupProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0) {
    return null;
  }

  items = items.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 py-2 rounded-lg hover:bg-accent w-full mb-2"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <h2 className="font-semibold">
          {group.name}
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
          <span>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
        </span>
      </button>

      {isOpen && (
        <div className="ml-4 space-y-2">
          {items.filter(item => item.groupId === group.id).map((item) => (
            <StarItemRow key={item.id} item={item} handleClick={handleItemClick} />
          ))}

          {subgroups.map((subgroup) => (
            <StarGroupList
              key={subgroup.id}
              group={subgroup}
              items={items.filter(item => item.groupId === subgroup.id)}
              subgroups={subgroups.filter(g => g.parentId === subgroup.id)}
              handleItemClick={handleItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}