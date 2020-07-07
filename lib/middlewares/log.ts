import { Next, Middleware } from "../types.ts";
import { Request } from "../request.ts";
import { Response } from "../response.ts";
import { colors, emojize } from "../deps.ts";

const { red, yellow, cyan, green } = colors;

const log = (req: Request, res: Response, emojis: boolean = false): void => {
    const { method, error, url } = req;
    const { status } = res;
    const now = new Date();

    if (!res) console.log(`[${method}] ${url}`);
    
    const MESSAGE = `${now} [${method}] ${url} - ${status}`;
    const BASE_MESSAGE = emojis ? emojize(`:rocket: ${MESSAGE}`) : `${MESSAGE}`;
    const BASE_ERROR_MESSAGE = emojis ? emojize(`:bug: ${MESSAGE}`) : BASE_MESSAGE;
    const ERROR_MESSAGE = emojis ? emojize(`${BASE_ERROR_MESSAGE} - ${error}`) : `${BASE_MESSAGE} - ${error}`;

    if (status >= 500 && error) console.log(red(ERROR_MESSAGE));
    else if (status >= 500) console.log(red(BASE_ERROR_MESSAGE));
    else if (status >= 400) console.log(yellow(BASE_MESSAGE));
    else if (status >= 300) console.log(cyan(BASE_MESSAGE));
    else if (status >= 200) console.log(green(BASE_MESSAGE));
}

export const logMiddleware: Middleware = async (req: Request, res: Response, next: Next): Promise<void> => {
    await next();
    log(req, res);
}

export const emojiLogMiddleware: Middleware = async (req: Request, res: Response, next: Next): Promise<void> => {
    await next();
    log(req, res, true);
}