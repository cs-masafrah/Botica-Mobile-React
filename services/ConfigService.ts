// services/ConfigService.ts
import { bagistoService } from "./bagisto";

export interface CoreConfig {
  id: string;
  code: string;
  value: string;
}

export interface CoreConfigResponse {
  coreConfigs: {
    paginatorInfo: {
      currentPage: number;
      lastPage: number;
      total: number;
      hasMorePages: boolean;
    };
    data: CoreConfig[];
  };
}

class ConfigService {
  private configs: CoreConfig[] = [];
  private baseUrl: string = "";

  // Initialize with your Bagisto base URL
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Fetch all core configs
  async fetchCoreConfigs(): Promise<CoreConfig[]> {
    try {
      console.log("📋 [CONFIG SERVICE] Fetching core configs...");

      const query = `
        query CoreConfigs {
          coreConfigs(first: 1000000, page: 1) {
            paginatorInfo {
              currentPage
              lastPage
              total
              hasMorePages
            }
            data {
              id
              code
              value
            }
          }
        }
      `;

      const result =
        await bagistoService.executeQuery<CoreConfigResponse>(query);

      if (result?.coreConfigs?.data) {
        this.configs = result.coreConfigs.data;
        console.log(
          `✅ [CONFIG SERVICE] Loaded ${this.configs.length} configs`,
        );
        return this.configs;
      }

      console.log("⚠️ [CONFIG SERVICE] No configs data returned");
      return [];
    } catch (error) {
      console.error("❌ [CONFIG SERVICE] Failed to fetch core configs:", error);
      return [];
    }
  }

  // Get a specific config value by code
  getConfigValue(code: string): string | null {
    const config = this.configs.find((c) => c.code === code);
    return config ? config.value : null;
  }

  // Get admin logo URL
  getAdminLogoUrl(): string | null {
    const logoPath = this.getConfigValue(
      "general.design.admin_logo.logo_image",
    );

    if (!logoPath) {
      return null;
    }

    // Construct the full URL
    // Remove 'configuration/' prefix if it exists
    const cleanPath = logoPath;

    // Construct the URL based on your Bagisto storage setup
    // Common patterns:
    // 1. Relative path: https://your-domain.com/storage/{path}
    // 2. Full URL: Already a complete URL
    // 3. Storage path: storage/{path}

    if (logoPath.startsWith("http")) {
      // Already a full URL
      return logoPath;
    } else if (this.baseUrl) {
      // Construct full URL from base URL
      const base = this.baseUrl.replace("/graphql", "").replace("/api", "");
      return `${base}/storage/${cleanPath}`;
    }

    return null;
  }

  // Get favicon URL
  getFaviconUrl(): string | null {
    const faviconPath = this.getConfigValue(
      "general.design.admin_logo.favicon",
    );

    if (!faviconPath) {
      return null;
    }

    const cleanPath = faviconPath.replace("configuration/", "");

    if (faviconPath.startsWith("http")) {
      return faviconPath;
    } else if (this.baseUrl) {
      const base = this.baseUrl.replace("/graphql", "").replace("/api", "");
      return `${base}/storage/${cleanPath}`;
    }

    return null;
  }

  // Check if guest checkout is enabled
  isGuestCheckoutEnabled(): boolean {
    const value = this.getConfigValue(
      "sales.checkout.shopping_cart.allow_guest_checkout",
    );
    return value === "1";
  }

  // Get shipping carrier configs
  getShippingCarriers(): Array<{
    code: string;
    title: string;
    description: string;
    active: boolean;
    defaultRate?: string;
    type?: string;
  }> {
    const carriers = [];

    // Check for free shipping
    const freeTitle = this.getConfigValue("sales.carriers.free.title");
    const freeActive = this.getConfigValue("sales.carriers.free.active");

    if (freeTitle && freeActive === "1") {
      carriers.push({
        code: "free",
        title: freeTitle,
        description:
          this.getConfigValue("sales.carriers.free.description") || freeTitle,
        active: true,
      });
    }

    // Check for flat rate shipping
    const flatrateTitle = this.getConfigValue("sales.carriers.flatrate.title");
    const flatrateActive = this.getConfigValue(
      "sales.carriers.flatrate.active",
    );

    if (flatrateTitle && flatrateActive === "1") {
      carriers.push({
        code: "flatrate",
        title: flatrateTitle,
        description:
          this.getConfigValue("sales.carriers.flatrate.description") ||
          flatrateTitle,
        active: true,
        defaultRate: this.getConfigValue(
          "sales.carriers.flatrate.default_rate",
        ),
        type: this.getConfigValue("sales.carriers.flatrate.type"),
      });
    }

    return carriers;
  }
}

// Create a singleton instance
import { BAGISTO_CONFIG } from "@/constants/bagisto";
export const configService = new ConfigService(BAGISTO_CONFIG.baseUrl);
