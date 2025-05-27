import { FastifyReply, FastifyRequest } from "fastify";
import { ImageParams, ImageQuery } from "../routes/type";
import { validateDimensions } from "../utils";
import { cacheImage, getCachedImage, getFallbackCache, waitForImageInCache, withLock } from "../services/cache/redis";
import { getS3Object } from "../services/s3";
import { processImage } from "../services/image";
import { Readable, pipeline } from "stream";
import { promisify } from 'util';

import { setImageHeaders, streamBuffer, streamToBuffer } from "../utils/helpers";

const pipelineAsync = promisify(pipeline);

function isReadableStream(obj: unknown): obj is Readable {
    return obj instanceof Readable || (typeof obj === 'object' && obj !== null && 'pipe' in obj);
}



export async function downloadImage(
  req: FastifyRequest<{ Querystring: { key?: string } }>,
  res: FastifyReply
) {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).send({ error: 'Missing image key' });
    }

    const s3Key = `${key}`;
    const s3Response = await getS3Object(s3Key);

    if (!s3Response.Body) {
      return res.status(404).send({ error: 'Image not found' });
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of s3Response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const base64String = buffer.toString('base64');

    res.send({ base64: base64String });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({ error: 'Failed to download image' });
  }
}


export async function getImage(
  req: FastifyRequest<{ Params: ImageParams; Querystring: ImageQuery }>,
  res: FastifyReply
) {
    // const { folder, fileKey } = req.params;
    const { width: w, height: h, key } = req.query;

    const dimensions = validateDimensions(w, h);
    if (!dimensions) {
      return res.status(400).send({ error: 'Invalid dimensions' });
    }

  try {

    const resizedKey = `image:${key}:${dimensions.width}x${dimensions.height}`;
    const originalKey = `image:${key}:original`;
    const s3Key = `${key}`;

    // Check resized cache first
    const cachedResized = await getCachedImage(resizedKey);
    if (cachedResized) {
      return streamBuffer(cachedResized, res);
    }

    // Lock and process (or wait)
    const result = await withLock(resizedKey, 10, async () => {
      let originalBuffer = await getCachedImage(originalKey);

      // Fetch from S3 if not in original cache
      if (!originalBuffer) {
        const s3Response = await getS3Object(s3Key);
        // console.log('S3 response:', s3Response);

        if (!s3Response || !s3Response.Body) {
          console.warn('S3 response is empty or invalid');
          const fallback = await getFallbackCache(dimensions);
          if (fallback) return res.send(fallback);
          return res.status(404).send({ error: 'Image not found' });
        }

        originalBuffer = await streamToBuffer(s3Response.Body as Readable);
        await cacheImage(originalKey, Readable.from(originalBuffer));
      }

      // Process image
      const { processedStream, cacheStream } = await processImage(Readable.from(originalBuffer), dimensions);
      await cacheImage(resizedKey, cacheStream);

      res.header('Content-Type', 'image/webp');
      return res.send(processedStream);
    });

    // If lock not acquired, poll cache for result
    if (!result) {
      const fallback = await waitForImageInCache(resizedKey, 5000, 100);
      if (fallback) return streamBuffer(fallback, res);

      const fallback01 = await getFallbackCache(dimensions);
      if (fallback01) return res.send(fallback01);

      return res.status(404).send({ error: 'Image not found' });
    }
  } catch (err) {

    const fallback01 = await getFallbackCache(dimensions);
    if (fallback01) return res.send(fallback01);
    // return res.status(500).send({ error: 'Internal server error' });
  }
}


