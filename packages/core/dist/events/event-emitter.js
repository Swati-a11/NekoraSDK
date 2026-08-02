export class SDKEventEmitter {
    listeners = new Map();
    anyListeners = [];
    on(eventType, listener) {
        const list = this.listeners.get(eventType) || [];
        list.push(listener);
        this.listeners.set(eventType, list);
        return () => {
            const updated = (this.listeners.get(eventType) || []).filter((l) => l !== listener);
            this.listeners.set(eventType, updated);
        };
    }
    onAny(listener) {
        this.anyListeners.push(listener);
        return () => {
            this.anyListeners = this.anyListeners.filter((l) => l !== listener);
        };
    }
    emit(event) {
        const list = this.listeners.get(event.type) || [];
        for (const listener of list) {
            try {
                listener(event);
            }
            catch (err) {
                console.error(`Error in event listener for ${event.type}:`, err);
            }
        }
        for (const listener of this.anyListeners) {
            try {
                listener(event);
            }
            catch (err) {
                console.error(`Error in anyListener for ${event.type}:`, err);
            }
        }
    }
    toAsyncIterable() {
        const queue = [];
        let resolver = null;
        let done = false;
        const push = (evt) => {
            queue.push(evt);
            if (resolver) {
                resolver();
                resolver = null;
            }
            if (evt.type === "run.completed" ||
                evt.type === "run_completed" ||
                evt.type === "run.failed" ||
                evt.type === "run_failed") {
                done = true;
            }
        };
        // Subscribe IMMEDIATELY on toAsyncIterable() invocation so early events are never lost
        const unsub = this.onAny(push);
        const generator = (async function* () {
            try {
                while (!done || queue.length > 0) {
                    if (queue.length === 0) {
                        await new Promise((r) => {
                            resolver = r;
                        });
                    }
                    while (queue.length > 0) {
                        yield queue.shift();
                    }
                }
            }
            finally {
                unsub();
            }
        })();
        return generator;
    }
}
//# sourceMappingURL=event-emitter.js.map