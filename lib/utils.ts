import { Middleware, PathHandler, Method } from "./types.ts";

export const METHODS: Method[] = ["GET", "POST", "PATCH", "PUT", "DELETE"];

export const DEFAULT_CORS_OPTIONS: any = {
  origin: '*',
  methods: METHODS.join(','),
  preflight: true,
  successStatus: 204,
};

export const isPathHandler = (middleware: Middleware): middleware is PathHandler => {
  return typeof middleware !== 'function';
}

export const isString = (str: any): boolean => {
  return typeof str === "string" || str instanceof String;
}