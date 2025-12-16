# Shopify Integration Setup

Your app is now integrated with Shopify! Here's what you need to do to complete the setup:

## 1. Create a Custom App & Get Storefront Access Token

1. Go to your Shopify Admin panel
2. Navigate to **Settings** → **Apps and sales channels** → **Develop apps**
3. Click **Create an app** (or select your existing app)
4. Give it a name (e.g., "Mobile App")
5. Click **Configure Storefront API scopes**
6. Select these permissions:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_read_collection_listings`
7. Click **Save**
8. Click **Install app**
9. Go to the **API credentials** tab
10. Under **Storefront API access token**, click **Generate new token**
11. Copy the **Storefront API access token** (starts with a long alphanumeric string)

## 2. Configure Your App

Open `constants/shopify.ts` and update:

```typescript
export const SHOPIFY_CONFIG = {
  storeName: 'your-store-name',  // Just the store name (e.g., 'mystore' from 'mystore.myshopify.com')
  storefrontAccessToken: 'your-storefront-token',  // Storefront API access token from step 1
};
```

**Important:**
- `storeName`: Only the subdomain part (e.g., if your store is `pag0dd-wt.myshopify.com`, use `pag0dd-wt`)
- `storefrontAccessToken`: The Storefront API token (NOT Admin API token)
- **Why Storefront API?** It's designed for client-side use, supports CORS, and is safe to expose in your app

## 3. How It Works

The app will automatically:
- Fetch products from your Shopify store
- Display collections as categories
- Fall back to mock data if Shopify is unavailable
- Cache data for 5 minutes to improve performance

## 4. Features Integrated

✅ **Product Management**
- Products are fetched from Shopify Storefront API
- Product details (name, price, images, descriptions)
- Read-only access (secure for client-side)

✅ **Categories/Collections**
- Your Shopify collections become app categories
- Category filtering
- Custom collection images

✅ **Shopping Cart**
- Add products to cart
- Update quantities
- Checkout flow (you'll need to implement payment)

## 5. What You Can Manage in Shopify

From your Shopify admin panel, you can now manage:

### Products
- Add/edit/delete products
- Set prices and descriptions
- Upload product images
- Manage inventory

### Collections
- Create custom collections (categories)
- Organize products by collection
- Set collection images

### Orders (Coming Soon)
- Track customer orders
- Manage order fulfillment
- Process refunds

## 6. Next Steps

To complete the e-commerce experience, you may want to:

1. **Implement Checkout** - Use Shopify Checkout API
2. **Add Customer Authentication** - Login/signup via Shopify
3. **Order Tracking** - Connect orders to your app
4. **Banner Management** - Use Shopify metafields for banner images
5. **Product Reviews** - Integrate reviews and ratings

## 7. Testing

The app will:
- Show mock data if Shopify credentials are incorrect
- Display loading states while fetching
- Cache data to reduce API calls

## 8. API Limits

Shopify Storefront API has rate limits:
- 1000 requests per minute per IP
- Much more generous than Admin API
- The app caches data for 5 minutes to reduce API calls
- Works on web, iOS, and Android (CORS-enabled)

## Need Help?

- Check Shopify Storefront API docs: https://shopify.dev/docs/api/storefront
- Verify your API credentials in Shopify admin
- Make sure your access token has the right permissions
- **Common Issues:**
  - If you get CORS errors, make sure you're using Storefront API (not Admin API)
  - Make sure your token is a Storefront API token (not Admin API token)
  - Verify your store name is correct (just the subdomain)
