import { Middleware, PathHandler } from "./types.ts";

export const getNameFromPattern = (p: string) => {
    const name = p.slice(1, -1).trim();
    if (!name) {
      throw new Error("invalid param name");
    }
    return name;
}

export const isPathHandler = (middleware: Middleware): middleware is PathHandler => {
  return typeof middleware !== 'function';
}

export const isString = (str: any): boolean => {
  return typeof str === "string" || str instanceof String;
}