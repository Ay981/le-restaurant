"use client";

import { toast } from "sonner";

type ToastInput = {
  message: string;
  description?: string;
};

export function showSuccessToast({ message, description }: ToastInput) {
  toast.success(message, {
    description,
    duration: 4000,
  });
}

export function showErrorToast({ message, description }: ToastInput) {
  toast.error(message, {
    description,
    duration: 5000,
  });
}

export function showInfoToast({ message, description }: ToastInput) {
  toast(message, {
    description,
    duration: 3500,
  });
}
