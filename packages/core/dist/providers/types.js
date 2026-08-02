import { ProviderError } from "../errors/index.js";
export { ProviderError };
export class AuthenticationError extends ProviderError {
    constructor(provider, message = "Invalid API key or unauthorized request.") {
        super(`Provider '${provider}' error: ${message}`, provider, 401);
        this.name = "AuthenticationError";
    }
}
export class RateLimitError extends ProviderError {
    constructor(provider, message = "Rate limit exceeded (HTTP 429).") {
        super(`Provider '${provider}' error: ${message}`, provider, 429);
        this.name = "RateLimitError";
    }
}
export class ProviderServerError extends ProviderError {
    constructor(provider, statusCode, message = "Provider internal server error.") {
        super(`Provider '${provider}' error: ${message}`, provider, statusCode);
        this.name = "ProviderServerError";
    }
}
//# sourceMappingURL=types.js.map