import corsMiddleware from "cors";
import { RequestHandler } from "express";

export interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string | string[];
}

export function createCorsMiddleware(options: CorsOptions = {}): RequestHandler {
  return corsMiddleware({
    origin: options.origin ?? true,
    methods: options.methods ?? ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  });
}
