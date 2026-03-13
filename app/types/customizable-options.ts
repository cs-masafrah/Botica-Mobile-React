// types/customizable-options.ts
import { Product } from './product';

export type CustomizableOptionType = 
  | 'text'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'datetime'
  | 'time'
  | 'file';

export interface CustomizableOptionPrice {
  id: number;
  isDefault: boolean | null;
  isUserDefined: boolean | null;
  label: string;
  price: number;
  productCustomizableOptionId: string;
  qty: number | null;
  sortOrder: number;
}

export interface CustomizableOption {
  id: number;
  label: string;
  productId: string;
  type: CustomizableOptionType;
  isRequired: boolean;
  maxCharacters: number | null;
  supportedFileExtensions: string[] | null;
  sortOrder: number;
  customizableOptionPrices: CustomizableOptionPrice[];
}

// Extended product type with customizable options
export interface ProductWithCustomizableOptions extends Product {
  customizableOptions?: CustomizableOption[];
  hasCustomizableOptions?: boolean;
}

// Selected options for cart
export interface SelectedCustomizableOption {
  optionId: number;
  optionValue: string | string[] | any; // any for File object
  price: number;
  label: string;
}