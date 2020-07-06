import { PathMatcher, Params } from './types.ts';
import { getNameFromPattern } from './utils.ts';

export const defaultPathMatcher: PathMatcher = (_pattern: string) => {
    const pattern = _pattern.split('/');
    const names = new Set();
    pattern.forEach((p: string, i: number) => {
        if (p[0] == "{" && p[p.length - 1] == "}") {
            try {
                const name = getNameFromPattern(p);
                if (names.has(name)) throw new Error('duplicate name');
                names.add(name);
            } catch (err) {
                throw err;
            }
        } else if (!p.trim() && i > 0 && i < pattern.length - 1) {
            throw new Error('invalid path segment');
          }
    });
    return (_path: string) => {
        const path = _path.split('/');
        if (path.length !== pattern.length) return null;
        const params: Params = {};
        pattern.forEach((p: string, i: number) => {
            if (p[0] == "{" && p[p.length - 1] == "}") {
                const name = p.slice(1, -1).trim();
                params[name] = path[i];
            } else if (p !== path[i]) return null;
        })
        return params;
    };
}