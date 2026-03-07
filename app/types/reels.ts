export interface Product {
  id: string;
  name: string;
  sku: string;
  price?: number;
  formatted_price?: string;
  images?: Array<{
    id: string;
    url: string;
    alt?: string;
  }>;
}

// types/reels.ts
export interface Reel {
  id: string;
  title: string;
  caption?: string;
  video_url: string;
  thumbnail_url?: string;
  is_active: boolean;
  duration?: number;
  sort_order: number;
  likes_count: number;
  views_count: number;
  is_liked?: boolean;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  translations?: Array<{
    locale: string;
    title: string;
    caption?: string;
  }>;
}

export interface ReelLikeResponse {
  success: boolean;
  message?: string;
  liked: boolean;
  reel: Reel;
}

export interface ReelViewResponse {
  success: boolean;
  message?: string;
  views_count: number;
  reel: Reel;
}