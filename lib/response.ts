import { http, path, lookup, bodyReader } from "./deps.ts";

const { stat, open, readFile } = Deno;
type Reader = Deno.Reader;
type Closer = Deno.Closer;

export class Response {
    status: number = 200;
    headers: Headers = new Headers();
    body?: string | Uint8Array | Reader;
    resources: Closer[] = [];

    getHttpResponse(): http.Response {
        let { status = 200, headers, body = new Uint8Array() } = this;
        if (typeof body === "string") {
            body = new TextEncoder().encode(body);
            if (!headers.has('Content-Type')) headers.append("Content-Type", "text/plain");
        }
        return { status, headers, body };
    }

    close() {
        this.resources.forEach((resource: Closer) => {
            resource.close();
        })
    }

    setHeader(key: any, value: any) {
        this.headers.set(key, value);
    }
    
    appendHeader(key: any, value: any) {
        this.headers.append(key, value);
    }

    async empty(status: number): Promise<void> {
        this.status = status;
    }

    async json(json: any): Promise<void> {
        this.headers.append("Content-Type", "application/json");
        this.body = JSON.stringify(json);
    }

    async file(filepath: string, transform?: (source: string) => string): Promise<void> {
        const notModified = false;
        if (notModified) {
            this.status = 304;
            return;
        }
        const extname: string = path.extname(filepath);
        const contentType: any = lookup(extname.slice(1)) || '';
        const info = await stat(filepath);
        if (!info.isFile) return;
        this.appendHeader("Content-Type", contentType);
        if (transform) {
            const bytes = await readFile(filepath);
            const str = transform(new TextDecoder().decode(bytes));
            this.body = new TextEncoder().encode(str);
        } else {
            const file = await open(filepath);
            this.resources.push(file);
            this.body = file;
        }
    }
}