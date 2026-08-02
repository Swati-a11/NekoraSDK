import { SDKEvent, SDKEventType } from "./types.js";
export declare class SDKEventEmitter {
    private listeners;
    on<K extends SDKEventType>(eventType: K, listener: (data: Extract<SDKEvent, {
        type: K;
    }>) => void): () => void;
    emit(event: SDKEvent): void;
    toAsyncIterable(): AsyncIterable<SDKEvent>;
}
//# sourceMappingURL=event-emitter.d.ts.map