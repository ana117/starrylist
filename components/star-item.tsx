'use client';

import { StarItem } from "@/lib/types";
import { ExternalLink, Star } from "lucide-react";
import { useEffect, useState } from "react";

interface StarItemRowProps {
  item: StarItem;
  handleClick: (item: StarItem) => void;
}

export function StarItemRow({ item, handleClick }: StarItemRowProps) {
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const linkLimit = 3;

  useEffect(() => {
    if (item.links.length === 0) {
      setMinPrice(null);
      setMaxPrice(null);
      return;
    }

    let min: number | null = null;
    let max: number | null = null;

    item.links.forEach(link => {
      if (link.price) {
        if (min === null || link.price < min) {
          min = link.price;
        }
        if (max === null || link.price > max) {
          max = link.price;
        }
      }
    });

    setMinPrice(min);
    setMaxPrice(max);
  }, [item.links]);

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
        <div className="flex flex-col items-left gap-2 text-left">
          {item.notes && (
            <span className="text-xs text-muted-foreground whitespace-pre-wrap">
              {item.notes}
            </span>
          )}
        </div>

        <div className="flex flex-col items-right gap-2">
          {item.price > 0 && (
            <span className="text-xs ml-auto">
              {new Intl.NumberFormat('en-ID', {
                style: 'currency',
                currency: 'IDR',
              }).format(item.price)}
            </span>
          )}
        </div>
      </div>

      {item.links.length > 0 && (
        <div className="flex justify-between gap-2 w-full">
          <div className="flex gap-4">
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
          {minPrice !== null && maxPrice !== null && (
            <span className="text-xs text-muted-foreground ml-auto">
              {minPrice === maxPrice
                ? new Intl.NumberFormat('en-ID', {
                    style: 'currency',
                    currency: 'IDR',
                  }).format(minPrice)
                : new Intl.NumberFormat('en-ID', {
                    style: 'currency',
                    currency: 'IDR',
                  }).format(minPrice) + ' - ' + new Intl.NumberFormat('en-ID', {
                    style: 'currency',
                    currency: 'IDR',
                  }).format(maxPrice)}
            </span>
          )}
        </div>
      )}
    </button>
  );
}