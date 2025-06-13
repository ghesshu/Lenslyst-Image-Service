import sharp from "sharp";
import { Readable } from "stream";
import { ImageDimensions } from "./types";

export async function processImage(
  stream: Readable,
  dimensions: ImageDimensions,
) {
  // Validate dimensions first
  const validatedDims = {
    width: typeof dimensions.width === "number" ? dimensions.width : undefined,
    height:
      typeof dimensions.height === "number" ? dimensions.height : undefined,
  };

  const transform = sharp()
    .rotate()
    .trim()
    .resize({
      width: validatedDims.width,
      height: validatedDims.height,
      fit: "cover",
      withoutEnlargement: true,
      fastShrinkOnLoad: true,
    })
    .webp({
      quality: 80,
      effort: 4,
    });

  const processedStream = stream.pipe(transform);

  // Clone the processed stream for caching
  // The original processedStream will be for the response
  const cacheStream = processedStream.clone();

  return { processedStream, cacheStream };
}
