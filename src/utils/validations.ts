import { ALLOWED_FOLDERS, ALLOWED_MIME_TYPES } from './constants';

export function validateParams(folder: string, fileKey: string): boolean {
  return ALLOWED_FOLDERS.includes(folder) && /^[a-zA-Z0-9-_]+\.[a-zA-Z0-9]+$/.test(fileKey);
}

export function validateDimensions(width?: string, height?: string): { width: number; height: number } | null {
  const w = width ? parseInt(width, 10) : 0;
  const h = height ? parseInt(height, 10) : 0;
  
  if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0) {
    return null;
  }
  
  return { width: w, height: h };
}