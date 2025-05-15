import path from 'path';
import { promises as fs } from 'fs';
import Redis from 'ioredis';
import { Readable } from 'stream';
import { CACHE_TTL } from '../../utils';
import { ImageDimensions } from '../image/types';
import { processImage01 } from '../image';

const redis = new Redis(process.env.REDIS_URL!, {
  lazyConnect: false,
  maxRetriesPerRequest: 2,
  reconnectOnError: (err) => {
    console.error('Redis reconnecting due to error:', err);
    return true;
  },
  retryStrategy: (times) => {
    console.warn(`Redis reconnect attempt #${times}`);
    return Math.min(times * 100, 2000); // wait time between retries
  },
});

// Get image buffer from cache
export async function getCachedImage(cacheKey: string): Promise<Buffer | null> {
  return await redis.getBuffer(cacheKey);
}

// Cache image by streaming into buffer first
export async function cacheImage(cacheKey: string, stream: Readable): Promise<void> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const buffer = Buffer.concat(chunks);
  await redis.setex(cacheKey, CACHE_TTL, buffer);
}

// Lock to prevent concurrent processing
export async function withLock<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T | null> {
  const lockKey = `lock:${key}`;
  // ioredis syntax: set(key, value, mode, duration_unit, duration, [mode2, ...])
  const acquired = await redis.set(lockKey, 'locked', 'EX', ttl, 'NX');
  if (!acquired) return null;
  try {
    return await fn();
  } finally {
    await redis.del(lockKey);
  }
}

// Poll for a cached image until available or timeout
export async function waitForImageInCache(
  cacheKey: string,
  timeoutMs = 5000,
  intervalMs = 100
): Promise<Buffer | null> {
  const start = Date.now();
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      const cached = await getCachedImage(cacheKey);
      if (cached) {
        clearInterval(interval);
        return resolve(cached);
      }
      if (Date.now() - start >= timeoutMs) {
        clearInterval(interval);
        return resolve(null);
      }
    }, intervalMs);
  });
}

// export async function getFallbackCache(dimensions: ImageDimensions ): Promise<Buffer | null> {
//     try {
//         const cacheKey = `fallback-img:${dimensions.width || 'auto'}x${dimensions.height || 'auto'}`;

//         // Try to get the cached image first
//         const cachedImage = await redis.getBuffer(cacheKey);
//         if (cachedImage) {
//             return cachedImage;
//         }

//         // Always use logo-bg.png as the fallback image
//         const defaultImagePath = path.join(process.cwd(), 'src', 'media', 'logo-bg.png');
//         const imageBuffer = await fs.readFile(defaultImagePath);
        
//         // Process the fallback image with the same dimensions as requested
//         const processedImage = await sharp(imageBuffer)
            // .resize({
            //     width: dimensions.width,
            //     height: dimensions.height,
            //     fit: 'cover',
            //     withoutEnlargement: true
            // })
            // .webp({ quality: 80 })
//             .toBuffer();
        
//         // Cache the processed fallback image with dimensions in the key

//         await redis.setex(cacheKey, CACHE_TTL, processedImage);
        
//         return processedImage;
//     } catch (error) {
//         return null;
//     }
// }

export async function getFallbackCache(dimensions: ImageDimensions ): Promise<Readable | null> {
    try {
        const cacheKey = `fallback-img:${dimensions.width || 'auto'}x${dimensions.height || 'auto'}`;
        console.log('Cache key:', cacheKey);

        // Try to get the cached image first
        const cachedImage = await getCachedImage(cacheKey);
        if (cachedImage) {
            return Readable.from(cachedImage);
        }

        // Always use logo-bg.png as the fallback image
        const defaultImagePath = path.join(process.cwd(), 'src', 'media', 'logo-bg.png');
        const imageBuffer = await fs.readFile(defaultImagePath);

        // Process the image
        const { processedStream, cacheStream } = await processImage01(Readable.from(imageBuffer), dimensions);

        // Cache processed image
        await cacheImage(cacheKey, cacheStream);

        
        return processedStream;

    } catch (error) {
        return null;
    }
}