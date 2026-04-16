"use client";

import { AlertCircle } from "lucide-react";

interface AuthErrorAlertProps {
  message?: string;
}

export function AuthErrorAlert({ message }: AuthErrorAlertProps) {
  if (!message) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-sm animate-shake">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
