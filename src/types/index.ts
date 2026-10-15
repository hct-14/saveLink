export interface Category {
  id: string;
  userId: string;
  name: string;
  parentId?: string | null;
  icon?: string;
  color?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  url: string;
  cleanUrl: string;
  title: string;
  description?: string;
  favicon?: string;
  imageUrl?: string;
  categoryId?: string | null;
  tags?: string[];
  notes?: string;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'grid' | 'list';
export type ThemeMode = 'light' | 'dark';

export interface ScrapedMetadata {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  favicon: string;
  domain: string;
  fallback?: boolean;
}
