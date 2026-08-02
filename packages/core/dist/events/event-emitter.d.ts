import { SDKEvent, SDKEventType } from "./types.js";
export declare class SDKEventEmitter {
    private listeners;
    private anyListeners;
    on<K extends SDKEventType>(eventType: K, listener: (data: Extract<SDKEvent, {
        type: K;
    }>) => void): () => void;
    onAny(listener: (evt: SDKEvent) => void): () => void;
    emit(event: SDKEvent): void;
    toAsyncIterable(): AsyncIterableGenerator<SDKEvent>;
}
export type AsyncIterableGenerator<T> = AsyncGenerator<T, void, unknown>;
//# sourceMappingURL=event-emitter.d.ts.map