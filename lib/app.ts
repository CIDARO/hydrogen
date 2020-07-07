import { Middleware, Next, Method, EndHandler, PathMatcher } from "./types.ts";
import { Request } from "./request.ts";
import { Response } from "./response.ts";
import { isPathHandler, METHODS, DEFAULT_CORS_OPTIONS } from "./utils.ts";
import { defaultPathMatcher } from "./matchers.ts";
import { http, EventEmitter } from './deps.ts';
import { jsonParser, urlencodedParser } from "./middlewares/parser.ts";
import { corsMiddleware } from "./middlewares/cors.ts";
import { emojiLogMiddleware, logMiddleware } from "./middlewares/log.ts";
import { serveStatic } from "./middlewares/static.ts";

/**
 * Hydrogen application.
 */
export class App {
    private middlewares: Middleware[] = []; // Middleware chain
    private corsOptions: any = DEFAULT_CORS_OPTIONS; // Default cors options
    private pathMatcher: PathMatcher = defaultPathMatcher; // Default path matcher
    emitter: EventEmitter = new EventEmitter(); // Hydrogen event emitter

    /**
     * Overrides the default path matcher for the application.
     * 
     * @param pathMatcher - PathMatcher that will override the default one,
     * @returns The application instance itself.
     */
    setPathMatcher(pathMatcher: PathMatcher): App {
        this.pathMatcher = pathMatcher;
        return this;
    }

    /**
     * Adds a new Middleware to the middleware chain.
     * 
     * @param middleware - Middleware that will be added to the chain.
     * @returns The application instance itself.
     */
    use(middleware: Middleware): App {
        this.middlewares.push(middleware);
        return this;
    }

    /**
     * Adds the CORS middleware to the middleware chain.
     * 
     * @param corsOptions - CORS options that will override the default ones.
     * @returns The application instance itself.
     */
    enableCors(corsOptions?: any): App {
        this.corsOptions = corsOptions || this.corsOptions;
        this.middlewares.push(corsMiddleware);
        return this;
    }

    /**
     * Adds the logging middleware to the middleware chain.
     * 
     * @param emojis - Boolean value that defines whether to log emojis or not.
     * @returns The application instance itself.
     */
    enableLog(emojis: boolean = false): App {
        const mw = emojis ? emojiLogMiddleware : logMiddleware;
        this.middlewares.push(mw);
        return this;
    }

    /**
     * Adds the static files middleware to the middleware chain.
     * 
     * @param directory - Directory filepath to serve.
     * @returns The application instance itself.
     */
    enableStatic(directory: string): App {
        this.middlewares.push(serveStatic(directory));
        return this;
    }

    /**
     * Adds the JSON parser middleware to the middleware chain.
     * 
     * @returns The application instance itself.
     */
    parseJson(): App {
        this.middlewares.push(jsonParser);
        return this;
    }

    /**
     * Adds the URLEncoded parser middleware to the middleware chain.
     * 
     * @returns The application instance itself.
     */
    parseUrlencoded(): App {
        this.middlewares.push(urlencodedParser);
        return this;
    }

    /**
     * Adds a new EndHandler on GET requests for the input pattern.
     * 
     * @param pattern - String pattern that will be used to match this handler (eg. "/api").
     * @param end - EndHandler that will be called on match.
     * @returns The application instance itself.
     */
    get(pattern: string, end: EndHandler): App {
        this._addPathHandler("GET", pattern, end);
        return this;
    }

    /**
     * Adds a new EndHandler on POST requests for the input pattern.
     * 
     * @param pattern - String pattern that will be used to match this handler (eg. "/api").
     * @param end - EndHandler that will be called on match.
     * @returns The application instance itself.
     */
    post(pattern: string, end: EndHandler): App {
        this._addPathHandler("POST", pattern, end);
        return this;
    }

    /**
     * Adds a new EndHandler on PUT requests for the input pattern.
     * 
     * @param pattern - String pattern that will be used to match this handler (eg. "/api").
     * @param end - EndHandler that will be called on match.
     * @returns The application instance itself.
     */
    put(pattern: string, end: EndHandler): App {
        this._addPathHandler("PUT", pattern, end);
        return this;
    }

    /**
     * Adds a new EndHandler on PATCH requests for the input pattern.
     * 
     * @param pattern - String pattern that will be used to match this handler (eg. "/api").
     * @param end - EndHandler that will be called on match.
     * @returns The application instance itself.
     */
    patch(pattern: string, end: EndHandler): App {
        this._addPathHandler("PATCH", pattern, end);
        return this;
    }

    /**
     * Adds a new EndHandler on DELETE requests for the input pattern.
     * 
     * @param pattern - String pattern that will be used to match this handler (eg. "/api").
     * @param end - EndHandler that will be called on match.
     * @returns The application instance itself.
     */
    delete(pattern: string, end: EndHandler): App {
        this._addPathHandler("DELETE", pattern, end);
        return this;
    }

    /**
     * Adds a new EndHandler on all requests for the input pattern.
     * 
     * @param pattern - String pattern that will be used to match this handler (eg. "/api").
     * @param end - EndHandler that will be called on match.
     * @returns The application instance itself.
     */
    all(pattern: string, end: EndHandler): App {
        METHODS.forEach((method: Method) => {
            this._addPathHandler(method, pattern, end);
        });
        return this;
    }

    /**
     * Creates a new HTTP Server and starts listening on every request.
     * 
     * @param port - Port used to listen.
     * @param hostname - Hostname used (default "127.0.0.1") .
     */
    async listen(port: number, hostname: string = "127.0.0.1") {
        const app: App = this;
        const server = http.serve(`${hostname}:${port}`);
        let abort = false;
        async function start() {
            app.emitter.emit('start', { port, hostname });
            for await (const request of server) {
                if (abort) break;
                const req = new Request(request);
                app.emitter.emit('request', req);
                const res = new Response();
                try {
                    await app._executeMiddlewares(app.middlewares, req, res);
                } catch (e) {
                    if (!res.status) res.status = 500;
                }
                try {
                    await request.respond(res.getHttpResponse());
                } finally {
                    app.emitter.emit('response', res);
                    res.close();
                }
            }
        }
        async function close() {
            app.emitter.emit('close', true);
            abort = true;
        }
        await start();
        return { port, close };
    }

    /**
     * Creates a new HTTPS Server and starts listening on every request.
     * 
     * @param port - Port used to listen.
     * @param hostname - Hostname used (default "127.0.0.1").
     * @param certFile - Path to the cert file.
     * @param keyFile - Path to the key file.
     */
    async listenTLS(port: number, hostname: string = "127.0.0.1", certFile: string, keyFile: string) {
        const app: App = this;
        const server = http.serveTLS({port, hostname, certFile, keyFile});
        let abort = false;
        async function start() {
            app.emitter.emit('start', { port, hostname, certFile, keyFile });
            for await (const request of server) {
                if (abort) break;
                const req = new Request(request);
                app.emitter.emit('request', req);
                const res = new Response();
                try {
                    await app._executeMiddlewares(app.middlewares, req, res);
                } catch (e) {
                    if (!res.status) res.status = 500;
                }
                try {
                    await request.respond(res.getHttpResponse());
                } finally {
                    app.emitter.emit('response', res);
                    res.close();
                }
            }
        }
        async function close() {
            app.emitter.emit('close', true);
            abort = true;
        }
        await start();
        return { port, close };
    }

    /**
     * Recursive function that start executing all the middlewares in the chain.
     * 
     * @param middlewares - Middleware list that will be executed.
     * @param req - {@link Request}.
     * @param res - {@link Response}.
     */
    private async _executeMiddlewares(middlewares: Middleware[], req: Request, res: Response): Promise<any> {
        if (middlewares.length) {
            const [middleware, ...others] = middlewares;
            await this._executeMiddleware(middleware, middlewares.length, req, res, () => {
                return this._executeMiddlewares(others, req, res);
            })
        }
    }

    /**
     * Tries to execute the input middleware by matching his pattern with the current request.
     * If true, it gets executed.
     * 
     * @param middleware - Middleware to execute.
     * @param req - {@link Request}.
     * @param res - {@link Response}.
     * @param next - {@link Next}.
     */
    private async _executeMiddleware(middleware: Middleware, length: number, req: Request, res: Response, next: Next): Promise<any> {
        this.emitter.emit('middleware', middleware);
        if (isPathHandler(middleware)) {
            const { method, pattern, match,  end } = middleware;
            if (method !== req.method) next();
            else {
                req = match(req, pattern);
                if (req.extra.matchedPattern !== pattern || !req.extra.matchedPattern) {
                    if (length === 1) await res.setStatus(404);
                    next();
                }
                else {
                    req.corsOptions = this.corsOptions;
                    // req.params = getParamsFromUrl(req.url);
                    await end(req, res);
                }
            }
        } else {
            await middleware(req, res, next);
        }
    }

    /**
     * Adds the input data as a new PathHandler.
     * 
     * @param method - Method used for the EndHandler (eg. "GET").
     * @param pattern - Pattern that will be used by the PathMatcher (eg. "/api").
     * @param end - EndHandler instance (function async (req, res)).
     */
    private _addPathHandler(method: Method, pattern: string, end: EndHandler) {
        this.middlewares.push({
            method, pattern, match: this.pathMatcher, end
        });
    }

}