# Shopify Admin API Setup for In-App Checkout

The app now creates orders directly in Shopify without redirecting to an external checkout page. This requires a Shopify Admin API access token.

## How to Get Your Shopify Admin Access Token

### Step 1: Create a Custom App
1. Go to your Shopify admin: `https://YOUR_STORE.myshopify.com/admin`
2. Navigate to **Settings** → **Apps and sales channels**
3. Click **Develop apps**
4. Click **Create an app**
5. Give it a name (e.g., "Mobile App Orders")

### Step 2: Configure Admin API Scopes
1. Click **Configure Admin API scopes**
2. Enable these permissions:
   - `write_orders` - To create orders
   - `read_orders` - To read order details
   - `write_customers` - To create/update customer information
   - `read_customers` - To read customer information
3. Click **Save**

### Step 3: Install the App and Get Access Token
1. Click **Install app** in the top right
2. Confirm the installation
3. Click **Reveal token once** to see your Admin API access token
4. **IMPORTANT**: Copy this token immediately - you won't be able to see it again!

### Step 4: Add the Token to Your App
1. Open `constants/shopify.ts`
2. Replace `YOUR_ADMIN_ACCESS_TOKEN` with the token you copied:

```typescript
export const SHOPIFY_CONFIG = {
  storeName: 'your-store',
  storefrontAccessToken: 'your-storefront-token',
  adminAccessToken: 'shpat_xxxxxxxxxxxxxxxxxxxxx', // ← Add your Admin API token here
};
```

## How It Works

### Cash on Delivery Flow
1. Customer fills out delivery information in the app
2. Customer clicks "Place Order (Cash on Delivery)"
3. App creates the order directly in Shopify via Admin API
4. Order is marked as pending payment
5. Customer sees success message with order number
6. Payment will be collected upon delivery

### Order Details
- Orders appear immediately in your Shopify admin
- Payment status: Pending (marked as "Cash on Delivery")
- Order includes all product details, customer info, and shipping address
- You can process and fulfill the order normally through Shopify admin

## Benefits of In-App Checkout

✅ Better user experience - no external redirects
✅ Complete control over checkout flow
✅ Supports cash on delivery without payment gateway
✅ Orders sync directly with Shopify
✅ Easy to track and manage orders

## Security Note

Keep your Admin API access token secure:
- Never commit it to public repositories
- Only use it in server-side code or secure mobile apps
- Regularly rotate tokens for security
- Use environment variables in production

## Testing

To test the checkout flow:
1. Add products to cart
2. Go to checkout
3. Fill in delivery information
4. Click "Place Order (Cash on Delivery)"
5. Check your Shopify admin for the new order

The order will be created with pending payment status, ready for fulfillment.
