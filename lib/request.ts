import { Query, Params, Method } from "./types.ts";

export class Request {
    path: string;
    search: string;
    query: Query;
    params: Params = {};
    data: any;
    extra: any = {};
    corsOptions: any = {};
    error?: Error;

    constructor(public raw: any) {
        const url = new URL("http://a.b" + raw.url);
        this.path = url.pathname;
        this.search = url.search;
        this.query = {};
        const searchParams: any = new URLSearchParams(this.search) as any;
        for (let [k, v] of searchParams) {
            if (Array.isArray(this.query[k])) {
                this.query[k] = [...this.query[k], v];
            } else if (typeof this.query[k] === "string") {
                this.query[k] = [this.query[k], v];
            } else {
                this.query[k] = v;
            }
        }
    }

    get method(): Method {
        return this.raw.method;
    }

    get url(): string {
        return this.raw.url;
    }

    get headers(): Headers {
        return this.raw.headers;
    }

    get body(): () => Promise<Uint8Array> {
        return this.raw.body.bind(this.raw);
    }
}