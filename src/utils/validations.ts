import { ALLOWED_FOLDERS, ALLOWED_MIME_TYPES } from './constants';

// export function validateParams(folder: string, fileKey: string): boolean {
//   return ALLOWED_FOLDERS.includes(folder) && /^[a-zA-Z0-9-_]+\.[a-zA-Z0-9]+$/.test(fileKey);
// }

export function validateDimensions(width?: string, height?: string): { width: number | 'auto'; height: number | 'auto' } | null {
  const w = width === 'auto' ? 'auto' : (width ? parseInt(width, 10) : 0);
  const h = height === 'auto' ? 'auto' : (height ? parseInt(height, 10) : 0);
  
  if (
    (w !== 'auto' && (isNaN(w) || w <= 0)) ||
    (h !== 'auto' && (isNaN(h) || h <= 0))
  ) {
    return null;
  }
  
  return { 
    width: w === 'auto' ? 'auto' : w, 
    height: h === 'auto' ? 'auto' : h 
  };
}