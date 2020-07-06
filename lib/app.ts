import { Middleware, Next, Method, EndHandler } from "./types.ts";
import { Request } from "./request.ts";
import { Response } from "./response.ts";
import { isPathHandler } from "./utils.ts";
import { defaultPathMatcher } from "./matchers.ts";
import { corsMiddleware } from "./cors.ts";
import { http } from './deps.ts';

export class App {
    middlewares: Middleware[] = [];
    corsOptions: any = {
        origin: '*',
        methods: 'GET,POST,PUT,DELETE,HEAD,PATCH',
        preflight: true,
        successStatus: 204,
    };

    use(middleware: Middleware) {
        this.middlewares.push(middleware);
    }

    cors(corsOptions?: any) {
        this.corsOptions = corsOptions || this.corsOptions;
        this.middlewares.push(corsMiddleware);
    }

    async listen(port: number, host: string = "127.0.0.1") {
        const app: App = this;
        const server = http.serve(`${host}:${port}`);
        let abort = false;
        async function start() {
            for await (const request of server) {
                if (abort) break;
                const req = new Request(request);
                const res = new Response();
                try {
                    await app._executeMiddlewares(app.middlewares, req, res);
                } catch (e) {
                    if (!res.status) res.status = 500;
                }
                try {
                    await request.respond(res.getHttpResponse());
                } finally {
                    res.close();
                }
            }
        }
        async function close() {
            abort = true;
        }
        await start();
        return { port, close };
    }

    private async _executeMiddlewares(middlewares: Middleware[], req: Request, res: Response): Promise<any> {
        if (middlewares.length) {
            const [middleware, ...others] = middlewares;
            await this._executeMiddleware(middleware, req, res, () => {
                return this._executeMiddlewares(others, req, res);
            })
        }
    }

    private async _executeMiddleware(middleware: Middleware, req: Request, res: Response, next: Next): Promise<any> {
        if (isPathHandler(middleware)) {
            if (middleware.method !== req.method) next();
            else {
                const params = middleware.match(req.url);
                if (!params) next();
                else {
                    req.corsOptions = this.corsOptions;
                    req.extra.matchedPattern = middleware.pattern;
                    req.params = params;
                    await middleware.end(req, res);
                }
            }
        } else {
            await middleware(req, res, next);
        }
    }

    private _addPathHandler(method: Method, pattern: string, end: EndHandler) {
        this.middlewares.push({
            method, pattern, match: defaultPathMatcher(pattern), end
        });
    }

    get(pattern: string, end: EndHandler): void {
        this._addPathHandler("GET", pattern, end);
    }

    post(pattern: string, end: EndHandler): void {
        this._addPathHandler("POST", pattern, end);
    }

    put(pattern: string, end: EndHandler): void {
        this._addPathHandler("PUT", pattern, end);
    }

    patch(pattern: string, end: EndHandler): void {
        this._addPathHandler("PATCH", pattern, end);
    }

    delete(pattern: string, end: EndHandler): void {
        this._addPathHandler("DELETE", pattern, end);
    }
}