// Base types
export interface FilterHomeCategoriesInput {
  key: string;
  value: string;
}

export interface PaginatorInfo {
  count: number;
  currentPage: number;
  lastPage: number;
  total: number;
}

// Price related types
export interface Price {
  price: string;
  formattedPrice: string;
}

export interface PriceHtml {
  id: string;
  type: string;
  priceHtml: string;
  regularPrice: string;
  formattedRegularPrice: string;
  finalPrice: string;
  formattedFinalPrice: string;
}

export interface VariantPrice {
  id: string;
  regularPrice: Price;
  finalPrice: Price;
}

// Image types
export interface Image {
  id: string;
  type: string;
  url: string;
  productId: string;
}

// Additional data types
export interface AdditionalData {
  id: string;
  label: string;
  value: string;
  type: string;
}

// Review types
export interface Review {
  id: string;
  title: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Configuration types
export interface ConfigutableOption {
  id: string;
  label: string;
  swatchType?: string;
  swatchValue?: string;
}

export interface ConfigutableAttribute {
  id: string;
  code: string;
  label: string;
  swatchType: string;
  options: ConfigutableOption[];
}

export interface AttributeOptionIds {
  attributeId: string;
  attributeCode: string;
  attributeOptionId: string;
}

export interface ConfigutableIndex {
  id: string;
  attributeOptionIds: AttributeOptionIds[];
}

export interface ConfigutableData {
  attributes: ConfigutableAttribute[];
  index: ConfigutableIndex[];
  variantPrices: VariantPrice[];
}

// Product variant types
export interface Variant {
  id: string;
  type: string;
  sku: string;
}

// Related product types
export interface RelatedProduct {
  id: string;
  name: string;
  sku: string;
  urlKey: string;
  isSaleable: boolean;
  priceHtml: {
    finalPrice: string;
    formattedFinalPrice: string;
    regularPrice: string;
    formattedRegularPrice: string;
  };
  images: Array<{
    id: string;
    url: string;
  }>;
}

// Customizable option types
export interface CustomizableOptionTranslation {
  id: string;
  label: string;
}

export interface CustomizableOptionPrice {
  id: string;
  label: string;
  price: string;
}

export interface CustomizableOption {
  id: string;
  label: string;
  productId: string;
  type: string;
  isRequired: boolean;
  maxCharacters?: number;
  supportedFileExtensions?: string[];
  product: {
    id: string;
  };
  translations: CustomizableOptionTranslation[];
  customizableOptionPrices: CustomizableOptionPrice[];
}

// Grouped product types
export interface GroupedProductItem {
  id: string;
  qty: number;
  associatedProductId: string;
  associatedProduct: {
    id: string;
    name: string;
    type: string;
    sku: string;
    priceHtml: PriceHtml;
  };
}

// Downloadable types
export interface DownloadableSampleTranslation {
  id: string;
  title: string;
}

export interface DownloadableSample {
  id: string;
  fileName: string;
  translations: DownloadableSampleTranslation[];
}

export interface DownloadableLinkTranslation {
  id: string;
  title: string;
}

export interface DownloadableLink {
  id: string;
  title: string;
  price: string;
  url: string;
  file: string;
  fileName: string;
  type: string;
  sampleUrl: string;
  sampleFile: string;
  sampleFileUrl: string;
  sampleFileName: string;
  sampleType: string;
  sortOrder: number;
  productId: string;
  downloads: number;
  translations: DownloadableLinkTranslation[];
}

// Bundle option types
export interface BundleOptionTranslation {
  id: string;
  locale: string;
  label: string;
  productBundleOptionId: string;
}

export interface BundleOptionProduct {
  id: string;
  qty: number;
  isUserDefined: boolean;
  sortOrder: number;
  isDefault: boolean;
  productBundleOptionId: string;
  productId: string;
  product: {
    sku: string;
    name: string;
    id: string;
    priceHtml: PriceHtml;
  };
}

export interface BundleOption {
  id: string;
  type: string;
  isRequired: boolean;
  sortOrder: number;
  productId: string;
  bundleOptionProducts: BundleOptionProduct[];
  translations: BundleOptionTranslation[];
}

// Booking types
export interface SlotTime {
  to: string;
  from: string;
}

export interface SlotOneDay {
  id: string;
  to: string;
  from: string;
}

export interface SlotManyDays {
  to: string;
  from: string;
}

export interface EventTicketTranslation {
  locale: string;
  name: string;
  description: string;
}

export interface EventTicket {
  id: string;
  price: string;
  qty: number;
  name: string;
  description: string;
  specialPrice: string;
  specialPriceFrom?: string;
  specialPriceTo?: string;
  translations: EventTicketTranslation[];
}

export interface DefaultSlot {
  id: string;
  bookingType: string;
  duration: string;
  breakTime: string;
  slotManyDays: SlotManyDays[];
  slotOneDay: SlotOneDay[];
}

export interface AppointmentSlot {
  id: string;
  duration: string;
  breakTime: string;
  sameSlotAllDays: boolean;
  slotManyDays: SlotManyDays[];
  slotOneDay: SlotOneDay[];
}

export interface RentalSlot {
  id: string;
  rentingType: string;
  dailyPrice: string;
  hourlyPrice: string;
  sameSlotAllDays: boolean;
  slotManyDays: SlotManyDays[];
  slotOneDay: SlotOneDay[];
}

export interface TableSlot {
  id: string;
  priceType: string;
  guestLimit: number;
  duration: string;
  breakTime: string;
  preventSchedulingBefore: string;
  sameSlotAllDays: boolean;
  slotManyDays: SlotManyDays[];
  slotOneDay: SlotOneDay[];
}

export interface Booking {
  id: string;
  type: string;
  qty: string;
  location: string;
  showLocation: boolean;
  availableEveryWeek: boolean;
  availableFrom?: string;
  availableTo?: string;
  productId: string;
  product: {
    id: string;
  };
  defaultSlot: DefaultSlot;
  appointmentSlot: AppointmentSlot;
  eventTickets: EventTicket[];
  rentalSlot: RentalSlot;
  tableSlot: TableSlot;
}

// Main Product type
export interface Product {
  id: string;
  type: string;
  isInWishlist: boolean;
  isInSale: boolean;
  isSaleable: boolean;
  name: string;
  shareURL: string;
  urlKey: string;
  shortDescription: string;
  description: string;
  customizableOptions: CustomizableOption[];
  additionalData: AdditionalData[];
  priceHtml: PriceHtml;
  configutableData: ConfigutableData;
  sku: string;
  parentId: string | null;
  variants: Variant[];
  attributeFamily: {
    id: string;
  };
  superAttributes: Array<{
    id: string;
    code: string;
    adminName: string;
    type: string;
    position: number;
  }>;
  images: Image[];
  averageRating: number;
  percentageRating: number;
  reviews: Review[];
  groupedProducts: GroupedProductItem[];
  relatedProducts: RelatedProduct[];
  downloadableSamples: DownloadableSample[];
  downloadableLinks: DownloadableLink[];
  bundleOptions: BundleOption[];
  booking: Booking | null;
}

// Response types
export interface ProductByIdResponse {
  allProducts: {
    data: Product[];
    paginatorInfo: PaginatorInfo;
  };
}

// Simplified product for category listing
export interface ProductCategory {
  id: string;
  type: string;
  isInWishlist: boolean;
  isInSale: boolean;
  isSaleable: boolean;
  name: string;
  shareURL: string;
  urlKey: string;
  shortDescription: string;
  description: string;
  additionalData: AdditionalData[];
  priceHtml: PriceHtml;
  sku: string;
  images: Image[];
  averageRating: number;
  percentageRating: number;
  reviews: Review[];
}

export interface ProductsByCategoryResponse {
  allProducts: {
    data: ProductCategory[];
    paginatorInfo: PaginatorInfo;
  };
}