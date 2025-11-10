/**
 * Toast Component - Minimal notification toast
 * Used with react-hot-toast library
 */

"use client";

import React from "react";
import { Toaster, toast as hotToast } from "react-hot-toast";


export const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--surface)",
          color: "var(--ink)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-md)",
          boxShadow: "var(--shadow-md)",
          padding: "var(--s-12) var(--s-16)",
          fontSize: "0.875rem",
        },
        success: {
          iconTheme: {
            primary: "var(--success)",
            secondary: "var(--surface)",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--danger)",
            secondary: "var(--surface)",
          },
        },
      }}
    />
  );
};

// Custom toast helpers
export const toast = {
  success: (message: string) => hotToast.success(message),
  error: (message: string) => hotToast.error(message),
  loading: (message: string) => hotToast.loading(message),
  promise: hotToast.promise,
  dismiss: hotToast.dismiss,
};
