import { PathMatcher } from './types.ts';
import { Request } from './request.ts';

export const defaultPathMatcher: PathMatcher = (req: Request, pattern: string): Request => {
    if (pattern === '*') {
        req.extra.matchedPattern = pattern;
        return req;
    };
    let { url } = req;
    if (url.includes('?')) url = url.split('?')[0];
    if (url === pattern) {
        req.extra.matchedPattern = pattern;
    } else {
        req.extra.matchedPattern = null;
    }
    return req;
}