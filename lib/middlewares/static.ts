import { Next, Middleware } from "../types.ts";
import { Request } from "../request.ts";
import { Response } from "../response.ts";
import { path } from "../deps.ts";

export const serveStatic = (directory: string): Middleware => {
    return async (req: Request, res: Response, next: Next): Promise<void> => {
        const filepath = path.join(directory, req.url.slice(1) || "index.html"); 
        try {
            await res.file(filepath);
        } catch (err) {
            console.error('error in static middleware', err);
            await next();
        }
    }
}