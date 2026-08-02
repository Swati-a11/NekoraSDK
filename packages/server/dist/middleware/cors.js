import corsMiddleware from "cors";
export function createCorsMiddleware(options = {}) {
    return corsMiddleware({
        origin: options.origin ?? true,
        methods: options.methods ?? ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
    });
}
//# sourceMappingURL=cors.js.map