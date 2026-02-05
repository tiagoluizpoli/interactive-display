import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isBlank = (val: string | null | undefined): boolean => {
  return !val || val.trim().length === 0;
};
