import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SectionType = 
  | 'banner'
  | 'on-sale'
  | 'collection'
  | 'tag'
  | 'vendor'
  | 'vendors-row'
  | 'brands'
  | 'new-arrivals'
  | 'featured';

export type SortOrder = 'alphabetical' | 'latest' | 'random';

export interface HomepageSection {
  id: string;
  type: SectionType;
  title: string;
  enabled: boolean;
  config?: {
    collectionId?: string;
    collectionName?: string;
    tag?: string;
    vendorName?: string;
    limit?: number;
    sortOrder?: SortOrder;
  };
}

const DEFAULT_SECTIONS: HomepageSection[] = [
  {
    id: 'banner',
    type: 'banner',
    title: 'Hero Banner',
    enabled: true,
  },
  {
    id: 'on-sale',
    type: 'on-sale',
    title: 'On Sale',
    enabled: true,
  },
  {
    id: 'all-products',
    type: 'featured',
    title: 'All Products',
    enabled: true,
  },
];

const STORAGE_KEY = '@homepage_sections';

export const [HomepageConfigContext, useHomepageConfig] = createContextHook(() => {
  const [sections, setSections] = useState<HomepageSection[]>(DEFAULT_SECTIONS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as HomepageSection[];
          if (Array.isArray(parsed)) {
            console.log('Loaded sections from storage:', parsed);
            setSections(parsed);
          } else {
            console.warn('Invalid sections format, clearing storage');
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        } catch (parseError) {
          console.error('Failed to parse homepage sections:', parseError);
          console.log('Clearing invalid data from storage');
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load homepage sections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSections = async (newSections: HomepageSection[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSections));
      setSections(newSections);
      console.log('Saved sections to storage:', newSections);
    } catch (error) {
      console.error('Failed to save homepage sections:', error);
    }
  };

  const addSection = (section: Omit<HomepageSection, 'id'>) => {
    const newSection: HomepageSection = {
      ...section,
      id: `section-${Date.now()}`,
    };
    const newSections = [...sections, newSection];
    saveSections(newSections);
  };

  const removeSection = (id: string) => {
    const newSections = sections.filter(s => s.id !== id);
    saveSections(newSections);
  };

  const updateSection = (id: string, updates: Partial<HomepageSection>) => {
    const newSections = sections.map(s => 
      s.id === id ? { ...s, ...updates } : s
    );
    saveSections(newSections);
  };

  const reorderSections = (newOrder: HomepageSection[]) => {
    console.log('reorderSections called with:', newOrder.map(s => s.title));
    saveSections(newOrder);
  };

  const toggleSection = (id: string) => {
    const newSections = sections.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    saveSections(newSections);
  };

  const resetToDefaults = () => {
    saveSections(DEFAULT_SECTIONS);
  };

  return {
    sections,
    isLoading,
    addSection,
    removeSection,
    updateSection,
    reorderSections,
    toggleSection,
    resetToDefaults,
  };
});
