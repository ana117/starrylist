'use client';

import { StarItem } from "@/lib/types";
import { ExternalLink, Star } from "lucide-react";

interface StarItemRowProps {
  item: StarItem;
  handleClick: (item: StarItem) => void;
}

export function StarItemRow({ item, handleClick }: StarItemRowProps) {
  const linkLimit = 3;

  return (
    <button key={item.id} className="w-full flex flex-col items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent border border-border bg-card cursor-pointer transition-all group" onClick={() => handleClick(item)}>
      <div className="flex justify-between w-full">
        <span>{item.name}</span>
        <span className="flex items-center gap-1">
          {(() => {
            return (
              <>
                <span className="sr-only">Priority: {item.priority}</span>
                {Array.from({ length: item.priority }).map((_, i) => (
                  <Star key={i} className="w-3 h-3" strokeWidth={3} />
                ))}
              </>
            );
          })()}
        </span>
      </div>

      <div className="flex justify-between gap-2 w-full">
        <div className="flex flex-col items-left gap-2">
          {item.notes && (
            <span className="text-xs text-muted-foreground whitespace-pre-wrap">
              {item.notes}
            </span>
          )}
        </div>

        <div className="flex flex-col items-right gap-2">
            {item.price > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {new Intl.NumberFormat('en-ID', {
                  style: 'currency',
                  currency: 'IDR',
                }).format(item.price)}
              </span>
            )}
        </div>
      </div>

      {item.links.length > 0 && (
        <div className="flex gap-4 w-full">
          {item.links.slice(0, linkLimit).map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              title={link.label && link.label.trim() ? link.label : `Link ${index + 1}`}
            >
              <ExternalLink className="w-3 h-3" />
              {link.label && link.label.trim() ? link.label : `Link ${index + 1}`}
            </a>
          ))}
          {item.links.length > linkLimit && (
            <span className="text-xs text-muted-foreground">
              + {item.links.length - linkLimit} more
            </span>
          )}
        </div>
      )}
    </button>
  );
}