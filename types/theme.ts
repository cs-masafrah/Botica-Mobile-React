// types/theme.ts
export type ThemeType = 
  | 'product_carousel'
  | 'category_carousel'
  | 'static_content'
  | 'image_carousel'
  | 'footer_links'
  | 'services_content';

export interface ThemeLink {
  url: string;
  slug?: string;
  type?: string;
  id?: string;
  title?: string;
  sortOrder?: string;
}

export interface ThemeService {
  title: string;
  description: string;
  serviceIcon: string;
}

export interface ThemeImage {
  imageUrl: string;
}

export interface ThemeFilter {
  key: string;
  value: string;
}

export interface ThemeOptions {
  css?: string | null;
  html?: string | null;
  title?: string | null;
  links?: ThemeLink[] | null;
  services?: ThemeService[] | null;
  images?: ThemeImage[] | null;
  filters?: ThemeFilter[] | null;
  column_1?: ThemeLink[] | null;
  column_2?: ThemeLink[] | null;
  column_3?: ThemeLink[] | null;
}

export interface ThemeTranslation {
  localeCode: string;
  options: ThemeOptions;
}

export interface Theme {
  id: string;
  type: ThemeType;
  name: string;
  translations: ThemeTranslation[];
  // We'll add a calculated sortOrder based on ID or name
  sortOrder?: number;
}

export interface ThemeCustomizationResponse {
  themeCustomization: Theme[];
}
