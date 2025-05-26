import { FastifyInstance } from "fastify";
import { ImageParams, ImageQuery } from "./type";
import { downloadImage, getImage } from "../controllers/imageController";

export async function imageRoute(app: FastifyInstance){

    // Load Images
    app.get<{Params: ImageParams; Querystring: ImageQuery}>('/view-image', getImage)    

    // Download Images
    app.get<{Querystring: { key?: string }}>('/download/:folder/:fileKey', downloadImage)
    
}