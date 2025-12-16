import { Image } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

interface ImagePreloadResult {
  success: number;
  failed: number;
  total: number;
}

const BATCH_SIZE = 10;
const preloadedUrls = new Set<string>();

async function preloadBatch(urls: string[]): Promise<PromiseSettledResult<boolean | void>[]> {
  return Promise.allSettled(
    urls.map(async (url) => {
      if (preloadedUrls.has(url)) {
        return true;
      }
      
      try {
        await Promise.race([
          ExpoImage.prefetch(url),
          Image.prefetch(url),
        ]);
        preloadedUrls.add(url);
        return true;
      } catch (error) {
        console.warn(`Failed to preload: ${url}`, error);
        throw error;
      }
    })
  );
}

export async function preloadImages(imageUrls: string[]): Promise<ImagePreloadResult> {
  const uniqueUrls = [...new Set(imageUrls)].filter(url => !preloadedUrls.has(url));
  
  if (uniqueUrls.length === 0) {
    console.log('All images already preloaded');
    return { success: 0, failed: 0, total: 0 };
  }
  
  console.log(`🖼️ Starting to preload ${uniqueUrls.length} images in batches of ${BATCH_SIZE}...`);
  
  const batches: string[][] = [];
  for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
    batches.push(uniqueUrls.slice(i, i + BATCH_SIZE));
  }

  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < batches.length; i++) {
    const batchResults = await preloadBatch(batches[i]);
    const batchSuccess = batchResults.filter(r => r.status === 'fulfilled').length;
    const batchFailed = batchResults.filter(r => r.status === 'rejected').length;
    
    totalSuccess += batchSuccess;
    totalFailed += batchFailed;
    
    console.log(`✅ Batch ${i + 1}/${batches.length}: ${batchSuccess} succeeded, ${batchFailed} failed`);
  }

  console.log(`✨ Image preload complete: ${totalSuccess} succeeded, ${totalFailed} failed`);

  return {
    success: totalSuccess,
    failed: totalFailed,
    total: uniqueUrls.length,
  };
}

export function clearPreloadCache() {
  preloadedUrls.clear();
  console.log('🧹 Preload cache cleared');
}

export function extractImageUrls(data: any[]): string[] {
  const urls = new Set<string>();

  const traverse = (obj: any) => {
    if (!obj) return;
    
    if (typeof obj === 'string' && (obj.startsWith('http://') || obj.startsWith('https://'))) {
      const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(obj) ||
                         obj.includes('images.unsplash.com') ||
                         obj.includes('cdn.shopify.com') ||
                         obj.includes('r2.dev');
      if (isImageUrl) {
        urls.add(obj);
      }
    } else if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        obj.forEach(traverse);
      } else {
        Object.values(obj).forEach(traverse);
      }
    }
  };

  data.forEach(traverse);
  return Array.from(urls);
}
