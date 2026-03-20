"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

export function DropdownMenu({ nodes }: { nodes: React.ReactNode[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="ghost" onClick={() => setIsOpen(!isOpen)}>
        More
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-card rounded-md shadow-lg z-10">
          {nodes.map((node, index) => (
            <a key={index} className="py-1" onClick={() => setIsOpen(false)} href="#">
              {node}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
