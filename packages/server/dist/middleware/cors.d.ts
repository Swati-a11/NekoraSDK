import { RequestHandler } from "express";
export interface CorsOptions {
    origin?: string | string[] | boolean;
    methods?: string | string[];
}
export declare function createCorsMiddleware(options?: CorsOptions): RequestHandler;
//# sourceMappingURL=cors.d.ts.map