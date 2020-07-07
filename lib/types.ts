import { Request } from './request.ts';
import { Response } from './response.ts'

// PathHandler interface
interface PathHandler {
    method: Method;
    pattern: string;
    match: PathMatcher;
    end: EndHandler;
}

// HTTP method type
type Method = 'HEAD' | 'OPTIONS' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
// Web framework Next function
type Next = () => Promise<void>;
// HTTP handler
type Handler = (req: Request, res: Response, next: Next) => Promise<void>;
// HTTP end handler
type EndHandler = (req: Request, res: Response) => Promise<void>;
// Web framework middleware
type Middleware = Handler | PathHandler;
// HTTP query type
type Query = { [key: string]: string | string[] };
// HTTP params type
type Params = { [key:string]: string };
// Pathmatcher type
type PathMatcher = (request: Request, pattern: string) => Request;

export { Method, Query, Params, PathMatcher, Handler, EndHandler, PathHandler, Middleware, Next };