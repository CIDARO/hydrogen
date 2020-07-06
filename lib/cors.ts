import { Next, Middleware } from "./types.ts";
import { Request } from "./request.ts";
import { Response } from "./response.ts";
import { isString } from "./utils.ts";

const ACCESS_CONTROL_ALLOW_ORIGIN = "Access-Control-Allow-Origin";
const ACCESS_CONTROL_ALLOW_METHODS = "Access-Control-Allow-Methods";
const ACCESS_CONTROL_ALLOW_CREDENTIALS = "Access-Control-Allow-Credentials";
const ACCESS_CONTROL_ALLOW_HEADERS = "Access-Control-Allow-Headers";
const ACCESS_CONTROL_REQUEST_HEADERS = "Access-Control-Request-Headers";
const ACCESS_CONTROL_EXPOSE_HEADERS = "Access-Control-Expose-Headers";
const ACCESS_CONTROL_MAX_AGE = "Access-Control-Max-Age";
const VARY = "Vary";

const isAllowed = (origin: string, allowedOrigins: any): boolean => {
    if (Array.isArray(allowedOrigins)) {
        return allowedOrigins.filter((or) => origin === or).length === 1;
    } else if (isString(allowedOrigins)) {
        return origin === allowedOrigins;
    } else if (allowedOrigins instanceof RegExp) {
        return allowedOrigins.test(origin);
    }
    return !!allowedOrigins;
}

const setOrigins = (options: any, request: Request) => {
    const { origin } = options;
    const reqOrigin = request.headers.get('origin');
    const headers = [];
    if (!origin) {
        headers.push([
            {
                key: ACCESS_CONTROL_ALLOW_ORIGIN,
                value: '*'
            }
        ]);
    } else if (isString(origin)) {
        headers.push([
            {
                key: ACCESS_CONTROL_ALLOW_ORIGIN,
                value: origin
            }
        ]);
        headers.push([
            {
                key: VARY,
                value: "Origin"
            }
        ]);
    } else {
        const allowed = reqOrigin ? isAllowed(reqOrigin, origin) : false;
        headers.push([
            {
                key: ACCESS_CONTROL_ALLOW_ORIGIN,
                value: allowed ? origin : false,
            }
        ]);
        headers.push([
            {
                key: VARY,
                value: "Origin"
            }
        ]);
    };
    return headers;
}

const setMethods = (options: any) => {
    let { methods } = options;
    if (methods.join) {
        methods = methods.join(',');
    }
    return {
        key: ACCESS_CONTROL_ALLOW_METHODS,
        value: methods
    }
}

const setCredentials = (options: any) => {
    const { credentials } = options;
    if (credentials) {
        return {
            key: ACCESS_CONTROL_ALLOW_CREDENTIALS,
            value: 'true'
        };
    }
    return null;
}

const setAllowedHeaders = (options: any, request: Request) => {
    let allowedHeaders = options.allowedHeaders || options.headers;
    const headers = [];

    if (!allowedHeaders) {
        allowedHeaders = request.headers.get(ACCESS_CONTROL_REQUEST_HEADERS);
        headers.push([{
            key: VARY,
            value: ACCESS_CONTROL_REQUEST_HEADERS
        }]);
    } else if (allowedHeaders.join) {
        allowedHeaders = allowedHeaders.join(',');
    };

    if (allowedHeaders && allowedHeaders.length) {
        headers.push([{
            key: ACCESS_CONTROL_ALLOW_HEADERS,
            value: allowedHeaders
        }])
    };

    return headers;
}

const setExposedHeaders = (options: any) => {
    let { exposedHeaders } = options;
    if (!exposedHeaders) return null;
    if (exposedHeaders.join) {
        exposedHeaders = exposedHeaders.join(',');
    }
    if (exposedHeaders && exposedHeaders.length) {
        return {
            key: ACCESS_CONTROL_EXPOSE_HEADERS,
            value: exposedHeaders
        };
    }
    return null;
}

const setMaxAge = (options: any) => {
    const maxAge = (typeof options.maxAge === 'number' || options.maxAge) && options.maxAge.toString()
    if (maxAge && maxAge.length) {
      return {
        key: ACCESS_CONTROL_MAX_AGE,
        value: maxAge
      };
    }
    return null;
}

const setHeaders = (headers: any[], response: Response) => {
    headers.forEach((header: any, index: number) => {
        if (header) {
            if (Array.isArray(header)) {
                setHeaders(header, response);
            } else {    
                const { key, value } = header;
                response.setHeader(key, value);
            }
        }
    })
}

export const corsMiddleware: Middleware = async (req: Request, res: Response, next: Next): Promise<void> => {
    const headers = [];
    const method = req.method && req.method.toUpperCase && req.method.toUpperCase();
    const options = req.corsOptions;

    if (method === 'OPTIONS') {
        // preflight
        headers.push(setOrigins(options, req));
        headers.push(setCredentials(options));
        headers.push(setMethods(options));
        headers.push(setAllowedHeaders(options, req));
        headers.push(setMaxAge(options));
        headers.push(setExposedHeaders(options));
        setHeaders(headers, res);

        if (options.preflight) {
            next();
        } else {
            // Safari (and potentially other browsers) need content-length 0,
            // for 204 or they just hang waiting for a body
            res.status = options.successStatus;
            res.setHeader('Content-Length', '0');
            res.close();
        }
    } else {
        // actual response
        headers.push(setOrigins(options, req));
        headers.push(setCredentials(options));
        headers.push(setExposedHeaders(options));
        setHeaders(headers, res);
        next();
    }
}