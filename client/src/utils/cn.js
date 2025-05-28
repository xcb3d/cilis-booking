import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind CSS class merging
 * Useful for merging conditional classes with tailwind classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
} 