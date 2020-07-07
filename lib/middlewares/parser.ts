import { Next, Middleware } from "../types.ts";
import { Request } from "../request.ts";
import { Response } from "../response.ts";

export const jsonParser: Middleware = async (req: Request, res: Response, next: Next): Promise<void> => {
    if (req.headers.get('Content-Type') === "application/json") {
        try {
            const body = await req.body();
            const bodyAsText = new TextDecoder().decode(body);
            const clearBody = bodyAsText.replace(/\0/g, '');
            const content = clearBody.split("\r\n\r\n")[1];
            req.data = JSON.parse(content);
        } catch (err) {
            res.setStatus(400);
            req.error = err.message;
            return;
        }
    }
    await next();
};

export const urlencodedParser: Middleware = async (req: Request, res: Response, next: Next): Promise<void> => {
    if (req.headers.get('Content-Type') === 'application/x-www-form-urlencoded') {
        try {
            const body = await req.body();
            const bodyAsText = new TextDecoder().decode(body);
            const data: any = {};
            const splittedBody = bodyAsText.split('&');
            splittedBody.forEach((split) => {
                const res = /^(.+?)=(.*)$/.exec(split);
                if (res && res.length >= 3) {
                    const key = decodeURIComponent(res[1].replace("+", ""));
                    const value = decodeURIComponent(res[2].replace("+", ""));
                    if (Array.isArray(data[key])) {
                        data[key] = [...data[key], value];
                    } else if (data[key]) {
                        data[key] = [data[key], value];
                    } else {
                        data[key] = value;
                    }
                }
            });
            req.data = data;
        } catch (err) {
            res.setStatus(400);
            req.error = err.message;
            return;
        }
    }
    await next();
};