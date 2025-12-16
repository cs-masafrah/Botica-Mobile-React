import { Url } from './../node_modules/lightningcss/node/ast.d';
import { Platform } from 'react-native';
import { SHOPIFY_CONFIG } from '@/constants/shopify';
import { Product, Category, ShippingZone, ShippingRate, ShippingDiscount } from '@/types/product';

const SHOPIFY_API_VERSION = '2024-10';

interface ProductNode {
  id: string;
  title: string;
  vendor: string;
  productType: string;
  description: string;
  tags: string[];
  featuredImage?: { url: string };
  images?: {
    edges: {
      node: {
        url: string;
      };
    }[];
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants?: {
    edges: {
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
        priceV2: {
          amount: string;
          currencyCode: string;
        };
        compareAtPriceV2?: {
          amount: string;
          currencyCode: string;
        };
        selectedOptions: {
          name: string;
          value: string;
        }[];
      };
    }[];
  };
  options?: {
    id: string;
    name: string;
    values: string[];
  }[];
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  buttonText?: string;
  cta?: string;
}

export interface Reel {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  productId?: string;
  description?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  name: string;
  createdAt: string;
  totalPrice: number;
  currencyCode: string;
  financialStatus: string;
  fulfillmentStatus: string;
  lineItems: {
    id: string;
    title: string;
    quantity: number;
    price: number;
    image?: string;
    variantTitle?: string;
  }[];
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    city?: string;
    country?: string;
  };
}

interface GraphQLResponse {
  data?: {
    product?: ProductNode;
    products?: {
      edges: {
        node: ProductNode;
      }[];
    };
    collections?: {
      edges: {
        node: {
          id: string;
          title: string;
          image?: { url: string };
        };
      }[];
    };
    metaobjects?: {
      edges: {
        node: {
          id: string;
          fields: {
            key: string;
            value: string;
            reference?: {
              image?: {
                url: string;
              };
            };
          }[];
        };
      }[];
    };
    cartCreate?: {
      cart?: {
        id: string;
        checkoutUrl: string;
      };
      userErrors?: {
        field: string[];
        message: string;
      }[];
    };
    orderCreate?: {
      order?: {
        id: string;
        name: string;
        email: string;
        totalPriceSet?: {
          shopMoney: {
            amount: string;
            currencyCode: string;
          };
        };
      };
      userErrors?: {
        field: string[];
        message: string;
      }[];
    };
  };
  errors?: { message: string }[];
}

export class ShopifyService {
  private baseUrl: string;
  private headers: Record<string, string>;
  private adminBaseUrl: string;
  private adminHeaders: Record<string, string>;

  constructor() {
    const storeName = SHOPIFY_CONFIG.storeName;
    const token = SHOPIFY_CONFIG.storefrontAccessToken;
    const adminToken = SHOPIFY_CONFIG.adminAccessToken;
    
    if (!storeName || storeName === 'YOUR_STORE_NAME' || !token || token === 'YOUR_STOREFRONT_ACCESS_TOKEN') {
      console.warn('Shopify not configured. Please update constants/shopify.ts');
      this.baseUrl = '';
      this.headers = {};
      this.adminBaseUrl = '';
      this.adminHeaders = {};
      return;
    }
    
    this.baseUrl = `https://${storeName}.myshopify.com/api/${SHOPIFY_API_VERSION}/graphql.json`;
    this.headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    };
    
    this.adminBaseUrl = `https://${storeName}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
    this.adminHeaders = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken || '',
    };
  }

  private async graphqlQuery(query: string): Promise<GraphQLResponse> {
    if (!this.baseUrl) {
      throw new Error('Shopify not configured');
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify API error response:', errorText);
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }

    const data: GraphQLResponse = await response.json();
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
    }

    return data;
  }

  private async adminGraphqlQuery(query: string): Promise<GraphQLResponse> {
    if (!this.adminBaseUrl || !this.adminHeaders['X-Shopify-Access-Token']) {
      throw new Error('Shopify Admin API not configured. Please add adminAccessToken to constants/shopify.ts');
    }

    const response = await fetch(this.adminBaseUrl, {
      method: 'POST',
      headers: this.adminHeaders,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify Admin API error response:', errorText);
      throw new Error(`Shopify Admin API error: ${response.status} - ${errorText}`);
    }

    const data: GraphQLResponse = await response.json();
    
    if (data.errors) {
      console.error('Admin GraphQL errors:', data.errors);
      throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
    }

    return data;
  }



  async getProducts(locale: 'en' | 'ar' = 'en'): Promise<Product[]> {
    try {
      console.log('Fetching products from Shopify Storefront API');
      console.log('Store URL:', this.baseUrl);
      
      const query = `
        {
          products(first: 50) {
            edges {
              node {
                id
                title
                vendor
                productType
                description
                tags
                featuredImage {
                  url
                }
                images(first: 10) {
                  edges {
                    node {
                      url
                    }
                  }
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                variants(first: 100) {
                  edges {
                    node {
                      id
                      title
                      availableForSale
                      priceV2 {
                        amount
                        currencyCode
                      }
                      compareAtPriceV2 {
                        amount
                        currencyCode
                      }
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                }
                options {
                  id
                  name
                  values
                }
              }
            }
          }
        }
      `;

      const response = await this.graphqlQuery(query);
      console.log('Products response:', JSON.stringify(response, null, 2));
      const products = response.data?.products?.edges || [];
      
      console.log(`Successfully fetched ${products.length} products from Shopify`);
      
      if (products.length === 0) {
        console.warn('No products returned from Shopify. Check if your store has products.');
      }
      
      return this.transformProducts(products, locale);
    } catch (error) {
      console.error('Error fetching Shopify products:', error);
      throw error;
    }
  }

  async getBanners(): Promise<Banner[]> {
    try {
      console.log('Fetching banners from Shopify Storefront API');
      
      const query = `
        {
          metaobjects(type: "banner", first: 10) {
            edges {
              node {
                id
                fields {
                  key
                  value
                  reference {
                    ... on MediaImage {
                      image {
                        url
                      }
                    }
                    ... on Collection {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await this.graphqlQuery(query);
      const metaobjects = response.data?.metaobjects?.edges || [];
      
      console.log(`Successfully fetched ${metaobjects.length} banners from Shopify`);
      console.log('Banners data:', JSON.stringify(metaobjects, null, 2));
      return this.transformBanners(metaobjects);
    } catch (error) {
      console.error('Error fetching Shopify banners:', error);
      return [];
    }
  }

  async getReels(): Promise<Reel[]> {
    try {
      console.log('Fetching reels from Shopify Storefront API');
      
      const query = `
        {
          metaobjects(type: "reels", first: 20) {
            edges {
              node {
                id
                fields {
                  key
                  value
                  type
                  reference {
                    ... on Video {
                      sources {
                        url
                        mimeType
                        format
                      }
                    }
                    ... on MediaImage {
                      image {
                        url
                      }
                    }
                    ... on Product {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await this.graphqlQuery(query);
      const metaobjects = response.data?.metaobjects?.edges || [];
      
      console.log(`Successfully fetched ${metaobjects.length} reels from Shopify`);
      console.log('Reels raw data:', JSON.stringify(metaobjects, null, 2));
      
      const transformedReels = this.transformReels(metaobjects);
      console.log('Transformed reels:', JSON.stringify(transformedReels, null, 2));
      
      return transformedReels;
    } catch (error) {
      console.error('Error fetching Shopify reels:', error);
      return [];
    }
  }

  async getCollections(): Promise<Category[]> {
    try {
      console.log('Fetching collections from Shopify Storefront API');
      
      const query = `
        {
          collections(first: 20) {
            edges {
              node {
                id
                title
                image {
                  url
                }
                products(first: 1) {
                  edges {
                    node {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await this.graphqlQuery(query);
      const collections = response.data?.collections?.edges || [];
      
      console.log(`Successfully fetched ${collections.length} collections from Shopify`);
      console.log('Collections data:', JSON.stringify(collections, null, 2));
      return this.transformCollections(collections);
    } catch (error) {
      console.error('Error fetching Shopify collections:', error);
      throw error;
    }
  }

  async getProductById(id: string, locale: 'en' | 'ar' = 'en'): Promise<Product | null> {
    try {
      console.log('Fetching product by ID:', id);
      
      let formattedId = id;
      if (!id.startsWith('gid://')) {
        formattedId = `gid://shopify/Product/${id}`;
        console.log('Formatted product ID:', formattedId);
      }
      
      const query = `
        {
          product(id: "${formattedId}") {
            id
            title
            vendor
            productType
            description
            featuredImage {
              url
            }
            images(first: 10) {
              edges {
                node {
                  url
                }
              }
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            collections(first: 1) {
              edges {
                node {
                  id
                  title
                }
              }
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  priceV2 {
                    amount
                    currencyCode
                  }
                  compareAtPriceV2 {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
            options {
              id
              name
              values
            }
            metafield(namespace: "custom", key: "smellslike") {
              value
            }
          }
        }
      `;

      const response = await this.graphqlQuery(query);
      console.log('Product response:', JSON.stringify(response, null, 2));
      
      if (!response.data?.product) {
        console.log('No product found in response');
        return null;
      }

      const transformed = this.transformProducts([{ node: response.data.product as any }], locale);
      console.log('Transformed product:', transformed[0]);
      return transformed[0] || null;
    } catch (error) {
      console.error('Error fetching Shopify product:', error);
      return null;
    }
  }

  async getProductsByCollection(collectionId: string, locale: 'en' | 'ar' = 'en'): Promise<Product[]> {
    try {
      console.log('Fetching products for collection:', collectionId);
      
      let formattedId = collectionId;
      if (!collectionId.startsWith('gid://')) {
        formattedId = `gid://shopify/Collection/${collectionId}`;
        console.log('Formatted collection ID:', formattedId);
      }
      
      const query = `
        {
          collection(id: "${formattedId}") {
            products(first: 50) {
              edges {
                node {
                  id
                  title
                  vendor
                  productType
                  description
                  tags
                  featuredImage {
                    url
                  }
                  images(first: 10) {
                    edges {
                      node {
                        url
                      }
                    }
                  }
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  variants(first: 100) {
                    edges {
                      node {
                        id
                        title
                        availableForSale
                        priceV2 {
                          amount
                          currencyCode
                        }
                        compareAtPriceV2 {
                          amount
                          currencyCode
                        }
                        selectedOptions {
                          name
                          value
                        }
                      }
                    }
                  }
                  options {
                    id
                    name
                    values
                  }
                }
              }
            }
          }
        }
      `;

      const response = await this.graphqlQuery(query);
      const products = (response.data as any)?.collection?.products?.edges || [];
      console.log(`Found ${products.length} products in collection ${formattedId}`);
      return this.transformProducts(products, locale);
    } catch (error) {
      console.error('Error fetching products by collection:', error);
      throw error;
    }
  }

  private parseMultilingualField(text: string, locale: 'en' | 'ar' = 'en'): string {
    if (!text) return '';
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    for (const line of lines) {
      if (line.startsWith(`${locale}.`)) {
        return line.substring(3).trim();
      }
    }
    
    const fallbackLine = lines.find(line => line.includes('.'));
    if (fallbackLine) {
      const parts = fallbackLine.split('.');
      if (parts.length > 1) {
        return parts.slice(1).join('.').trim();
      }
    }
    
    return text;
  }

  private transformProducts(edges: { node: any }[], locale: 'en' | 'ar' = 'en'): Product[] {
    return edges.map(({ node }) => {
      const variantEdges = node.variants?.edges || [];
      const firstVariant = variantEdges[0]?.node;
      const variantId = firstVariant?.id;
      const availableForSale = firstVariant?.availableForSale ?? true;
      
      if (!variantId) {
        console.warn(`Product ${node.title} (${node.id}) has no variants. This product cannot be purchased.`);
      }
      
      const images = node.images?.edges?.map((edge: any) => edge.node.url) || [];
      const featuredImage = node.featuredImage?.url || 'https://via.placeholder.com/400x500';
      const currencyCode = node.priceRange?.minVariantPrice?.currencyCode || 'USD';
      
      const variants = variantEdges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        price: parseFloat(edge.node.priceV2?.amount || edge.node.price?.amount || '0'),
        compareAtPrice: edge.node.compareAtPriceV2?.amount ? parseFloat(edge.node.compareAtPriceV2.amount) : undefined,
        currencyCode: edge.node.priceV2?.currencyCode || currencyCode,
        availableForSale: edge.node.availableForSale,
        selectedOptions: edge.node.selectedOptions || [],
      }));
      
      const options = node.options?.map((option: any) => ({
        id: option.id,
        name: option.name,
        values: option.values,
      })) || [];
      
      const compareAtPrice = firstVariant?.compareAtPriceV2?.amount 
        ? parseFloat(firstVariant.compareAtPriceV2.amount) 
        : undefined;

      const collectionEdge = node.collections?.edges?.[0];
      const collectionId = collectionEdge?.node?.id;
      const collectionName = collectionEdge?.node?.title;

      return {
        id: node.id,
        name: this.parseMultilingualField(node.title, locale),
        brand: node.vendor || 'Unknown',
        price: parseFloat(node.priceRange?.minVariantPrice?.amount || '0'),
        compareAtPrice,
        currencyCode,
        image: featuredImage,
        images: images.length > 0 ? images : [featuredImage],
        category: node.productType || 'Uncategorized',
        collectionId,
        collectionName,
        description: this.parseMultilingualField(node.description || '', locale),
        rating: 4.5,
        reviewCount: 0,
        inStock: availableForSale && !!variantId,
        variantId,
        variants,
        options,
        smellslike: node.metafield?.value || undefined,
        tags: node.tags || [],
      };
    });
  }

  private transformBanners(edges: { node: any }[]): Banner[] {
    return edges.map(({ node }) => {
      const fields = node.fields || [];
      const getFieldValue = (key: string) => {
        const field = fields.find((f: any) => f.key === key);
        return field?.value || '';
      };
      
      const getImageUrl = (key: string) => {
        const field = fields.find((f: any) => f.key === key);
        return field?.reference?.image?.url || '';
      };
      
      const getCollectionReference = (key: string) => {
        const field = fields.find((f: any) => f.key === key);
        return field?.reference?.id || '';
      };

      return {
        id: node.id,
        title: getFieldValue('title'),
        subtitle: getFieldValue('subtitle'),
        image: getImageUrl('image') || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
        buttonText: getFieldValue('button_text') || 'Shop Now',
        cta: getCollectionReference('cta'),
      };
    });
  }

  // private transformReels(edges: { node: any }[]): Reel[] {
  //   return edges.map(({ node }) => {
  //     const fields = node.fields || [];
      
  //     console.log('Raw node fields:', JSON.stringify(fields, null, 2));
      
  //     const getFieldValue = (key: string) => {
  //       const field = fields.find((f: any) => f.key === key);
  //       return field?.value || '';
  //     };
      
  //     const getVideoUrl = (key: string) => {
  //       const field = fields.find((f: any) => f.key === key);
  //       console.log(`Getting video URL for key "${key}":`, JSON.stringify(field, null, 2));
        
  //       if (field?.value && typeof field.value === 'string' && field.value.trim()) {
  //         console.log('Found video URL in value:', field.value);
  //         return field.value;
  //       }
        
  //       if (field?.reference?.sources?.[0]?.url) {
  //         console.log('Found video URL in reference:', field.reference.sources[0].url);
  //         return field.reference.sources[0].url;
  //       }
        
  //       console.log('No video URL found for key:', key);
  //       return '';
  //     };
      
  //     const getThumbnailUrl = (key: string) => {
  //       const field = fields.find((f: any) => f.key === key);
  //       console.log(`Getting thumbnail URL for key "${key}":`, JSON.stringify(field, null, 2));
        
  //       if (field?.value && typeof field.value === 'string' && field.value.trim()) {
  //         console.log('Found thumbnail URL in value:', field.value);
  //         return field.value;
  //       }
        
  //       if (field?.reference?.image?.url) {
  //         console.log('Found thumbnail URL in reference:', field.reference.image.url);
  //         return field.reference.image.url;
  //       }
        
  //       console.log('No thumbnail URL found for key:', key);
  //       return '';
  //     };
      
  //     const getProductReference = (key: string) => {
  //       const field = fields.find((f: any) => f.key === key);
  //       console.log(`Getting product reference for key "${key}":`, JSON.stringify(field, null, 2));
  //       return field?.reference?.id || field?.value || '';
  //     };

  //     const videoUrl = getVideoUrl('video') || getVideoUrl('video_url');
  //     const thumbnailUrl = getThumbnailUrl('thumbnail') || getThumbnailUrl('thumbnail_url') || 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=700&fit=crop';
      
  //     const productId = getProductReference('product_reference') || getProductReference('product');
      
  //     console.log('Final reel transformation:', {
  //       id: node.id,
  //       title: getFieldValue('title'),
  //       videoUrl,
  //       thumbnailUrl,
  //       productId,
  //       description: getFieldValue('description'),
  //     });

  //     return {
  //       id: node.id,
  //       title: getFieldValue('title'),
  //       videoUrl,
  //       thumbnailUrl,
  //       productId,
  //       description: getFieldValue('description'),
  //     };
  //   });
  // }

  private transformReels(edges: { node: any }[]): Reel[] {
  return edges.map(({ node }) => {
    const fields = node.fields || [];

    console.log('Raw node fields:', JSON.stringify(fields, null, 2));

    const getFieldValue = (key: string) => {
      const field = fields.find((f: any) => f.key === key);
      return field?.value || '';
    };

    const getVideoUrl = (key: string) => {
      const field = fields.find((f: any) => f.key === key);
      console.log(`Getting video URL for key "${key}":`, JSON.stringify(field, null, 2));

      if (field?.value && typeof field.value === 'string' && field.value.trim()) {
        console.log('Found video URL in value:', field.value);
        return field.value;
      }

      if (field?.reference?.sources?.[0]?.url) {
        console.log('Found video URL in reference:', field.reference.sources[0].url);
        return field.reference.sources[0].url;
      }

      console.log('No video URL found for key:', key);
      return '';
    };

    const getThumbnailUrl = (key: string) => {
      const field = fields.find((f: any) => f.key === key);
      console.log(`Getting thumbnail URL for key "${key}":`, JSON.stringify(field, null, 2));

      if (field?.value && typeof field.value === 'string' && field.value.trim()) {
        console.log('Found thumbnail URL in value:', field.value);
        return field.value;
      }

      if (field?.reference?.image?.url) {
        console.log('Found thumbnail URL in reference:', field.reference.image.url);
        return field.reference.image.url;
      }

      console.log('No thumbnail URL found for key:', key);
      return '';
    };

    // Updated to ONLY return reference.id if the referenced object is a Product
      // 🔥 FIX: detect ANY field of type product_reference, regardless of key
    const getProductReference = () => {
      const field = fields.find((f: any) => f.type === 'product_reference');

      console.log("Product field detected:", JSON.stringify(field, null, 2));

      if (!field) return '';

      if (field.reference?.id) {
        console.log("✔ Product reference found ID:", field.reference.id);
        return field.reference.id;
      }

      if (typeof field.value === 'string' && field.value.startsWith('gid://shopify/Product/')) {
        console.log("✔ Product value contains ID:", field.value);
        return field.value;
      }

      console.log("❌ No valid product ID found");
      return '';
    };

    const videoUrl = getVideoUrl('video') || getVideoUrl('video_url');
    const thumbnailUrl = getThumbnailUrl('thumbnail') || getThumbnailUrl('thumbnail_url') || 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=700&fit=crop';

    // Try both keys for product reference but ONLY take valid Product IDs
    const productId = getProductReference();

    console.log('Final reel transformation:', {
      id: node.id,
      title: getFieldValue('title'),
      videoUrl,
      thumbnailUrl,
      productId,
      description: getFieldValue('description'),
    });

    return {
      id: node.id,
      title: getFieldValue('title'),
      videoUrl,
      thumbnailUrl,
      productId,
      description: getFieldValue('description'),
    };
  });
}


  private transformCollections(edges: { node: any }[]): Category[] {
    const iconMap: Record<string, string> = {
      "Men's Perfume": 'User',
      "Women's Perfume": 'Sparkles',
      'International': 'Globe',
      'Arabian': 'Star',
      'Niche': 'Gem',
    };

    return edges.map(({ node }, index) => ({
      id: node.id,
      name: node.title,
      icon: iconMap[node.title] || 'Sparkles',
      image: node.image?.url || `https://images.unsplash.com/photo-${1594035910387 + index}?w=400&h=300&fit=crop`,
    }));
  }

  async createCheckout(items: { merchandiseId: string; quantity: number }[]): Promise<string> {
    try {
      console.log('Creating Shopify checkout with items:', items);
      
      const lineItems = items.map(item => {
        const variantId = item.merchandiseId;
        return `{
          merchandiseId: "${variantId}"
          quantity: ${item.quantity}
        }`;
      }).join('\n');

      const query = `
        mutation {
          cartCreate(input: {
            lines: [
              ${lineItems}
            ]
          }) {
            cart {
              id
              checkoutUrl
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      console.log('Checkout mutation query:', query);
      const response = await this.graphqlQuery(query);
      console.log('Checkout response:', JSON.stringify(response, null, 2));

      const cartCreate = response.data?.cartCreate;
      
      if (cartCreate?.userErrors && cartCreate.userErrors.length > 0) {
        const errorMessages = cartCreate.userErrors.map(e => e.message).join(', ');
        throw new Error(`Checkout creation failed: ${errorMessages}`);
      }

      const checkoutUrl = cartCreate?.cart?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error('No checkout URL returned from Shopify');
      }

      console.log('Checkout URL created:', checkoutUrl);
      return checkoutUrl;
    } catch (error) {
      console.error('Error creating Shopify checkout:', error);
      throw error;
    }
  }

  async createOrder(params: {
    lineItems: { variantId: string; quantity: number }[];
    customer: {
      email: string;
      firstName: string;
      lastName: string;
    };
    shippingAddress: {
      firstName: string;
      lastName: string;
      address1: string;
      city: string;
      phone: string;
      country: string;
    };
    shippingLine?: {
      title: string;
      price: number;
      code: string;
    };
    discountCodes?: string[];
  }): Promise<{ orderId: string; orderName: string }> {
    try {
      console.log('Creating Shopify order via REST API with params:', params);
      
      if (!this.adminHeaders['X-Shopify-Access-Token']) {
        throw new Error('Shopify Admin API not configured. Please add adminAccessToken to constants/shopify.ts');
      }

      const storeName = SHOPIFY_CONFIG.storeName;
      const restApiUrl = `https://${storeName}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/orders.json`;

      const lineItems = params.lineItems.map(item => {
        const numericId = item.variantId.replace('gid://shopify/ProductVariant/', '');
        return {
          variant_id: parseInt(numericId),
          quantity: item.quantity,
        };
      });

      const orderData: any = {
        order: {
          line_items: lineItems,
          customer: {
            email: params.customer.email,
            first_name: params.customer.firstName,
            last_name: params.customer.lastName,
          },
          shipping_address: {
            first_name: params.shippingAddress.firstName,
            last_name: params.shippingAddress.lastName,
            address1: params.shippingAddress.address1,
            city: params.shippingAddress.city,
            phone: params.shippingAddress.phone,
            country: params.shippingAddress.country,
          },
          financial_status: 'pending',
          note: 'Cash on Delivery',
          tags: 'cash-on-delivery, mobile-app',
          send_receipt: false,
          send_fulfillment_receipt: false,
        },
      };

      if (params.shippingLine) {
        console.log('Adding shipping line to order:', params.shippingLine);
        orderData.order.shipping_lines = [{
          title: params.shippingLine.title,
          price: params.shippingLine.price.toFixed(2),
          code: params.shippingLine.code,
        }];
      }

      if (params.discountCodes && params.discountCodes.length > 0) {
        console.log('🎁 Adding discount codes to order:', params.discountCodes);
        orderData.order.discount_codes = params.discountCodes.map(code => ({ code }));
        console.log('🎁 Discount codes formatted:', orderData.order.discount_codes);
      }

      console.log('🛒 Creating order with full data:', JSON.stringify(orderData, null, 2));

      const response = await fetch(restApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.adminHeaders['X-Shopify-Access-Token'],
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Order creation error response:', errorText);
        throw new Error(`Failed to create order: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Order creation response:', JSON.stringify(result, null, 2));
      
      if (result.order) {
        console.log('📦 Order details:', {
          id: result.order.id,
          name: result.order.name,
          subtotal: result.order.subtotal_price,
          shipping: result.order.total_shipping_price_set,
          total: result.order.total_price,
          discounts: result.order.discount_codes,
          totalDiscounts: result.order.total_discounts,
        });
      }

      if (result.errors) {
        const errorMessages = Object.entries(result.errors)
          .map(([key, messages]) => `${key}: ${(messages as string[]).join(', ')}`)
          .join('; ');
        throw new Error(`Order creation failed: ${errorMessages}`);
      }

      const order = result.order;
      if (!order || !order.id) {
        throw new Error('No order returned from Shopify');
      }

      console.log('Order created successfully:', order.id, order.name);
      return {
        orderId: `gid://shopify/Order/${order.id}`,
        orderName: order.name || `#${order.order_number}`,
      };
    } catch (error) {
      console.error('Error creating Shopify order:', error);
      throw error;
    }
  }

  async getCustomerOrders(accessToken: string): Promise<Order[]> {
    try {
      console.log('Fetching customer orders from Shopify');
      
      const query = `
        {
          customer(customerAccessToken: "${accessToken}") {
            orders(first: 50) {
              edges {
                node {
                  id
                  orderNumber
                  name
                  processedAt
                  financialStatus
                  fulfillmentStatus
                  totalPriceV2 {
                    amount
                    currencyCode
                  }
                  lineItems(first: 50) {
                    edges {
                      node {
                        title
                        quantity
                        variant {
                          id
                          title
                          priceV2 {
                            amount
                            currencyCode
                          }
                          image {
                            url
                          }
                        }
                      }
                    }
                  }
                  shippingAddress {
                    firstName
                    lastName
                    address1
                    city
                    country
                  }
                }
              }
            }
          }
        }
      `;

      const response = await this.graphqlQuery(query);
      const orders = (response.data as any)?.customer?.orders?.edges || [];
      
      console.log(`Successfully fetched ${orders.length} orders from Shopify`);
      return this.transformOrders(orders);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }
  }

  private transformOrders(edges: { node: any }[]): Order[] {
    return edges.map(({ node }) => {
      const lineItems = (node.lineItems?.edges || []).map((edge: any) => ({
        id: edge.node.variant?.id || '',
        title: edge.node.title,
        quantity: edge.node.quantity,
        price: parseFloat(edge.node.variant?.priceV2?.amount || '0'),
        image: edge.node.variant?.image?.url,
        variantTitle: edge.node.variant?.title !== 'Default Title' ? edge.node.variant?.title : undefined,
      }));

      return {
        id: node.id,
        orderNumber: node.orderNumber.toString(),
        name: node.name,
        createdAt: node.processedAt,
        totalPrice: parseFloat(node.totalPriceV2?.amount || '0'),
        currencyCode: node.totalPriceV2?.currencyCode || 'USD',
        financialStatus: node.financialStatus || 'PENDING',
        fulfillmentStatus: node.fulfillmentStatus || 'UNFULFILLED',
        lineItems,
        shippingAddress: node.shippingAddress,
      };
    });
  }

  async getShippingDiscounts(): Promise<ShippingDiscount[]> {
    try {
      if (Platform.OS === 'web') {
        console.log('🎁 [ShopifyService] ℹ️  Skipping Admin API call on web (CORS restriction)');
        return [];
      }
      
      console.log('🎁 [ShopifyService] Fetching shipping discounts from Shopify Admin REST API');
      
      if (!this.adminHeaders['X-Shopify-Access-Token']) {
        console.log('🎁 [ShopifyService] ⚠️  Admin API not configured');
        return [];
      }

      const storeName = SHOPIFY_CONFIG.storeName;
      const restApiUrl = `https://${storeName}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/price_rules.json`;

      console.log('🎁 [ShopifyService] Fetching from:', restApiUrl);

      const response = await fetch(restApiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.adminHeaders['X-Shopify-Access-Token'],
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎁 [ShopifyService] ❌ Error response:', response.status, errorText);
        throw new Error(`Failed to fetch shipping discounts: ${response.status}`);
      }

      const result = await response.json();
      console.log('🎁 [ShopifyService] ✅ Received price rules:', JSON.stringify(result, null, 2));
      
      const priceRules = result.price_rules || [];
      console.log(`🎁 [ShopifyService] Found ${priceRules.length} price rules`);
      
      const shippingDiscounts: ShippingDiscount[] = [];
      
      for (const rule of priceRules) {
        if (rule.target_type === 'shipping_line' && rule.value_type === 'percentage' && rule.value === '-100.0') {
          console.log('🎁 [ShopifyService] 🔍 Found free shipping rule:', {
            id: rule.id,
            title: rule.title,
            value: rule.value,
            target_type: rule.target_type,
            prerequisite_subtotal_range: rule.prerequisite_subtotal_range,
          });
          
          const discountCodesUrl = `https://${storeName}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/price_rules/${rule.id}/discount_codes.json`;
          
          try {
            const codesResponse = await fetch(discountCodesUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': this.adminHeaders['X-Shopify-Access-Token'],
              },
            });

            if (codesResponse.ok) {
              const codesResult = await codesResponse.json();
              const codes = codesResult.discount_codes || [];
              console.log('🎁 [ShopifyService] Discount codes:', codes.length);
              
              if (codes.length > 0) {
                const code = codes[0].code;
                const minimumAmount = parseFloat(rule.prerequisite_subtotal_range?.greater_than_or_equal_to || '0');
                const currency = rule.prerequisite_subtotal_range?.currency || 'ILS';
                
                console.log('🎁 [ShopifyService] Discount currency from API:', currency);
                console.log('🎁 [ShopifyService] Minimum amount from API:', minimumAmount, currency);
                
                const discountObj: ShippingDiscount = {
                  id: rule.id.toString(),
                  title: rule.title,
                  code,
                  minimumOrderAmount: minimumAmount,
                  currencyCode: currency,
                  type: 'FREE_SHIPPING' as const,
                };
                
                console.log('🎁 [ShopifyService] ✅ Adding free shipping discount:', discountObj);
                shippingDiscounts.push(discountObj);
              } else {
                console.log('🎁 [ShopifyService] ⚠️  No discount codes found for rule:', rule.id);
              }
            } else {
              console.log('🎁 [ShopifyService] ⚠️  Failed to fetch codes for rule:', rule.id);
            }
          } catch (codeError) {
            console.error('🎁 [ShopifyService] ❌ Error fetching codes:', codeError);
          }
        }
      }
      
      console.log(`🎁 [ShopifyService] ✅✅✅ Successfully loaded ${shippingDiscounts.length} free shipping discounts`);
      if (shippingDiscounts.length > 0) {
        console.log('🎁 [ShopifyService] Discounts summary:', shippingDiscounts.map(d => ({
          title: d.title,
          code: d.code,
          minimum: d.minimumOrderAmount,
          currency: d.currencyCode,
        })));
      }
      return shippingDiscounts;
    } catch (error) {
      console.error('🎁 [ShopifyService] ❌ Error fetching shipping discounts:', error);
      return [];
    }
  }

  async getShippingZones(countryCode?: string): Promise<ShippingZone[]> {
    try {
      if (Platform.OS === 'web') {
        console.log('🚚 [ShopifyService] ℹ️  Skipping Admin API call on web (CORS restriction)');
        return [];
      }
      
      console.log('🚚 [ShopifyService] Fetching shipping zones from Shopify Admin REST API');
      
      if (!this.adminHeaders['X-Shopify-Access-Token']) {
        console.log('🚚 [ShopifyService] ⚠️  Admin API not configured');
        return [];
      }

      const storeName = SHOPIFY_CONFIG.storeName;
      const restApiUrl = `https://${storeName}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/shipping_zones.json`;

      console.log('🚚 [ShopifyService] Fetching from:', restApiUrl);

      const response = await fetch(restApiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.adminHeaders['X-Shopify-Access-Token'],
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚚 [ShopifyService] ❌ Error response:', response.status, errorText);
        console.error('🚚 [ShopifyService] ℹ️  If running on web, Admin API calls may be blocked by CORS');
        throw new Error(`Failed to fetch shipping zones: ${response.status}`);
      }

      const result = await response.json();
      console.log('🚚 [ShopifyService] ✅ Received shipping zones:', JSON.stringify(result, null, 2));
      
      const shippingZones = result.shipping_zones || [];
      console.log(`🚚 [ShopifyService] Found ${shippingZones.length} shipping zones`);
      
      const zones: ShippingZone[] = [];
      
      for (const zone of shippingZones) {
        const countries = zone.countries?.map((c: any) => c.code) || [];
        
        if (countryCode && !countries.includes(countryCode)) {
          console.log(`🚚 [ShopifyService] Skipping zone ${zone.name} - doesn't include ${countryCode}`);
          continue;
        }
        
        const weightBasedRates = zone.weight_based_shipping_rates || [];
        const priceBasedRates = zone.price_based_shipping_rates || [];
        const carrierRates = zone.carrier_shipping_rate_providers || [];
        
        const shippingRates: ShippingRate[] = [];
        
        for (const rate of weightBasedRates) {
          const currency = rate.currency || 'ILS';
          console.log(`🚚 [ShopifyService] Weight-based rate: ${rate.name}, price: ${rate.price} ${currency}`);
          shippingRates.push({
            id: rate.id.toString(),
            title: rate.name,
            price: parseFloat(rate.price),
            currencyCode: currency,
          });
        }
        
        for (const rate of priceBasedRates) {
          const currency = rate.currency || 'ILS';
          console.log(`🚚 [ShopifyService] Price-based rate: ${rate.name}, price: ${rate.price} ${currency}`);
          shippingRates.push({
            id: rate.id.toString(),
            title: rate.name,
            price: parseFloat(rate.price),
            currencyCode: currency,
          });
        }
        
        for (const carrier of carrierRates) {
          const currency = 'ILS';
          console.log(`🚚 [ShopifyService] Carrier rate: Carrier, price: 0 ${currency}`);
          shippingRates.push({
            id: carrier.id.toString(),
            title: carrier.carrier_service_id ? `${carrier.service_filter?.['*'] || 'Carrier'}` : 'Carrier',
            price: 0,
            currencyCode: currency,
          });
        }
        
        console.log(`🚚 [ShopifyService] Zone "${zone.name}" has ${shippingRates.length} rates`);
        
        if (shippingRates.length > 0) {
          zones.push({
            id: zone.id.toString(),
            name: zone.name,
            countries,
            shippingRates,
          });
        }
      }
      
      console.log(`🚚 [ShopifyService] ✅✅✅ Successfully loaded ${zones.length} shipping zones with rates`);
      if (zones.length > 0) {
        console.log('🚚 [ShopifyService] Zones summary:', zones.map(z => ({
          name: z.name,
          ratesCount: z.shippingRates.length,
          rates: z.shippingRates.map(r => ({ title: r.title, price: r.price })),
        })));
      }
      return zones;
    } catch (error) {
      console.error('🚚 [ShopifyService] ❌ Error fetching shipping zones:', error);
      return [];
    }
  }


}

export const shopifyService = new ShopifyService();
