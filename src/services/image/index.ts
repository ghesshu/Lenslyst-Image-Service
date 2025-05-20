import sharp from 'sharp';
import { Readable } from 'stream';
import { ImageDimensions } from './types';

export async function processImage(stream: Readable, dimensions: ImageDimensions) {
  // Validate dimensions first
  const validatedDims = {
    width: typeof dimensions.width === 'number' ? dimensions.width : undefined,
    height: typeof dimensions.height === 'number' ? dimensions.height : undefined
  };

  const transform = sharp()
    .rotate()
    .trim()
    .resize({
      width: validatedDims.width,
      height: validatedDims.height,
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

  const validatedDims = {
    width: typeof dimensions.width === 'number' ? dimensions.width : undefined,
    height: typeof dimensions.height === 'number' ? dimensions.height : undefined
  };

  const transform = sharp()
    .resize({
     width: validatedDims.width,
      height: validatedDims.height,
      fit: 'cover',
      withoutEnlargement: true
    })
    .webp({ quality: 80 });

  const processedStream = stream.pipe(transform);

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
