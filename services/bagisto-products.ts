import { request, gql } from 'graphql-request';
import { BAGISTO_CONFIG } from '@/constants/bagisto';
import { Product } from '@/types/product';

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

// GraphQL Queries
const GET_PRODUCTS = gql`
  query products($categoryId: ID, $search: String, $page: Int, $limit: Int) {
    products(categoryId: $categoryId, search: $search, page: $page, limit: $limit) {
      data {
        id
        type
        sku
        name
        description
        shortDescription
        price
        formattedPrice {
          price
          specialPrice
          discountPercent
        }
        images {
          id
          url
          path
          type
          productId
        }
        inStock
        categories {
          id
          name
          slug
        }
        attributes {
          code
          value
        }
      }
      paginatorInfo {
        total
        currentPage
        lastPage
        perPage
      }
    }
  }
`;

const GET_PRODUCT_BY_ID = gql`
  query product($id: ID!) {
    product(id: $id) {
      id
      type
      sku
      name
      description
      shortDescription
      price
      formattedPrice {
        price
        specialPrice
        discountPercent
      }
      images {
        id
        url
        path
        type
        productId
      }
      inStock
      categories {
        id
        name
        slug
      }
      attributes {
        code
        value
      }
      variants {
        id
        sku
        name
        price
        formattedPrice {
          price
          specialPrice
          discountPercent
        }
        images {
          id
          url
          path
          type
          productId
        }
        inventory {
          qty
          isInStock
        }
        attributes {
          code
          value
        }
      }
    }
  }
`;

const GET_CATEGORIES = gql`
  query categories {
    categories {
      id
      name
      slug
      description
      image
      metaTitle
      metaDescription
      metaKeywords
    }
  }
`;

export class BagistoProductService {
  async getProducts(options?: {
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Product[]> {
    try {
      const data = await request<any>(GRAPHQL_ENDPOINT, GET_PRODUCTS, options);
      
      return data.products.data.map((product: any) => this.transformProduct(product));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const data = await request<any>(GRAPHQL_ENDPOINT, GET_PRODUCT_BY_ID, { id });
      
      if (!data.product) return null;
      
      return this.transformProduct(data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  async getCategories() {
    try {
      const data = await request<any>(GRAPHQL_ENDPOINT, GET_CATEGORIES);
      return data.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  private transformProduct(bagistoProduct: any): Product {
    const price = bagistoProduct.formattedPrice.specialPrice || bagistoProduct.price;
    const compareAtPrice = bagistoProduct.formattedPrice.specialPrice 
      ? bagistoProduct.price 
      : undefined;
    
    const variants = bagistoProduct.variants?.map((variant: any) => ({
      id: variant.id,
      title: variant.name,
      price: variant.formattedPrice.specialPrice || variant.price,
      compareAtPrice: variant.formattedPrice.specialPrice ? variant.price : undefined,
      currencyCode: 'USD', // Adjust based on your currency
      availableForSale: variant.inventory?.isInStock ?? true,
      selectedOptions: variant.attributes?.map((attr: any) => ({
        name: attr.code,
        value: attr.value,
      })) || [],
    })) || [];

    return {
      id: bagistoProduct.id,
      name: bagistoProduct.name,
      brand: bagistoProduct.sku, // Use SKU as brand placeholder
      price,
      compareAtPrice,
      currencyCode: 'USD', // Adjust based on your currency
      image: bagistoProduct.images[0]?.url || '',
      images: bagistoProduct.images.map((img: any) => img.url),
      category: bagistoProduct.categories[0]?.name || 'Uncategorized',
      collectionId: bagistoProduct.categories[0]?.id,
      collectionName: bagistoProduct.categories[0]?.name,
      description: bagistoProduct.description || bagistoProduct.shortDescription || '',
      rating: 4.5, // Default rating
      reviewCount: 0,
      inStock: bagistoProduct.inStock,
      variantId: variants[0]?.id,
      variants,
      options: this.extractOptions(bagistoProduct),
      tags: [],
    };
  }

  private extractOptions(product: any) {
    // Extract options from product attributes or variants
    const options: any[] = [];
    
    // This is a simplified version - adjust based on your actual data structure
    if (product.attributes) {
      product.attributes.forEach((attr: any) => {
        if (attr.code && attr.value) {
          const existingOption = options.find(opt => opt.name === attr.code);
          if (existingOption) {
            if (!existingOption.values.includes(attr.value)) {
              existingOption.values.push(attr.value);
            }
          } else {
            options.push({
              id: attr.code,
              name: attr.code,
              values: [attr.value],
            });
          }
        }
      });
    }
    
    return options;
  }
}

export const bagistoProductService = new BagistoProductService();