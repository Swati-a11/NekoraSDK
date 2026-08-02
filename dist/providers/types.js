export class ProviderError extends Error {
    provider;
    statusCode;
    isRetryable;
    cause;
    constructor(message, provider, statusCode, isRetryable = false, cause) {
        super(message);
        this.provider = provider;
        this.statusCode = statusCode;
        this.isRetryable = isRetryable;
        this.cause = cause;
        this.name = "ProviderError";
    }
}
export class AuthenticationError extends ProviderError {
    constructor(provider, message = "Invalid API Key or unauthorized") {
        super(message, provider, 401, false);
        this.name = "AuthenticationError";
    }
}
export class RateLimitError extends ProviderError {
    constructor(provider, message = "Rate limit exceeded") {
        super(message, provider, 429, true);
        this.name = "RateLimitError";
    }
}
export class ProviderServerError extends ProviderError {
    constructor(provider, statusCode, message = "Provider internal server error") {
        super(message, provider, statusCode, true);
        this.name = "ProviderServerError";
    }
}
//# sourceMappingURL=types.js.map