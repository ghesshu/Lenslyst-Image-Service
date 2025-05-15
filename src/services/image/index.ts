import sharp from 'sharp';
import { Readable } from 'stream';
import { ImageDimensions } from './types';

export async function processImage(stream: Readable, dimensions: ImageDimensions) {
  const transform = sharp()
    .rotate() // Auto-rotate based on EXIF
    .trim()
    .resize({
      width: dimensions.width,
      height: dimensions.height,
      fit: 'cover',
      withoutEnlargement: true,
      fastShrinkOnLoad: true,
    })
    .webp({
      quality: 80,
      effort: 4,
    });

  const processedStream = stream.pipe(transform);

  // Optional: clone the processed stream to write it to cache
  // This assumes you'll consume one stream for the response and one for caching
  // For that, you'll need to buffer it first (e.g., using stream-to-buffer)
  const chunks: Buffer[] = [];
  processedStream.on('data', chunk => chunks.push(chunk));
  
  await new Promise((resolve, reject) => {
    processedStream.on('end', resolve);
    processedStream.on('error', reject);
  });

  const finalBuffer = Buffer.concat(chunks);
  const responseStream = Readable.from(finalBuffer);
  const cacheStream = Readable.from(finalBuffer);

  return { processedStream: responseStream, cacheStream };
}
export async function processImage01(stream: Readable, dimensions: ImageDimensions) {
  const transform = sharp()
        .resize({
            width: dimensions.width,
            height: dimensions.height,
            fit: 'cover',
            withoutEnlargement: true
        })
        .webp({ quality: 80 })

  const processedStream = stream.pipe(transform);

  // Optional: clone the processed stream to write it to cache
  // This assumes you'll consume one stream for the response and one for caching
  // For that, you'll need to buffer it first (e.g., using stream-to-buffer)
  const chunks: Buffer[] = [];
  processedStream.on('data', chunk => chunks.push(chunk));
  
  await new Promise((resolve, reject) => {
    processedStream.on('end', resolve);
    processedStream.on('error', reject);
  });

  const finalBuffer = Buffer.concat(chunks);
  const responseStream = Readable.from(finalBuffer);
  const cacheStream = Readable.from(finalBuffer);

  return { processedStream: responseStream, cacheStream };
}
