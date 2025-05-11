"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export default function PropFilterInput(
  { initialSearchString, onSearchStringChange }: {
    initialSearchString: string;
    onSearchStringChange: (searchString: string) => void;
  },
) {
  const [propText, setPropText] = useState(initialSearchString);
  useEffect(() => {
    // Debounce the propText input.
    const handler = setTimeout(() => {
      onSearchStringChange(propText);
    }, 400);
    return () => clearTimeout(handler);
  }, [propText, onSearchStringChange]);

  return (
    <Input
      placeholder="Search prop text..."
      value={propText}
      onChange={(e) => setPropText(e.target.value)}
    />
  );
}
