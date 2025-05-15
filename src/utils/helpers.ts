import { FastifyReply } from "fastify";
import { getFallbackCache } from "../services/cache/redis";
import { ImageDimensions } from "../services/image/types";
import { Readable, pipeline } from "stream";

export function setImageHeaders(res: FastifyReply) {
res.header('Content-Type', 'image/webp');
res.header('Cache-Control', 'public, max-age=31536000');
}

// export async function streamBuffer(buffer: Buffer, res: FastifyReply) {
//     setImageHeaders(res);
//     const stream = new Readable();
//     stream.push(buffer);
//     stream.push(null);
//     return new Promise<void>((resolve, reject) => {
//         pipeline(stream, res.raw, (err) => {
//             if (err) return reject(err);
//             resolve();
//         });
//     });
// }

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

export function streamBuffer(buffer: Buffer, res: FastifyReply) {
  res.header('Content-Type', 'image/webp');
  return res.send(Readable.from(buffer));
}

// export async function serveFallbackImage(res: FastifyReply, dimensions: ImageDimensions) {
// const fallbackImage = await getFallbackCache(dimensions);
// if (fallbackImage) {
//     return streamBuffer(fallbackImage, res);
// }
// return null;
// }
