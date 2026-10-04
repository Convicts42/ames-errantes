"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function QueryPreset({ name, onValue }) {
  const params = useSearchParams();
  const value = params.get(name);
  useEffect(() => {
    onValue(value);
  }, [value, onValue]);
  return null;
}
