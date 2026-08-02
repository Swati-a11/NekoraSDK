export class SDKEventEmitter {
    listeners = new Map();
    on(eventType, listener) {
        const list = this.listeners.get(eventType) || [];
        list.push(listener);
        this.listeners.set(eventType, list);
        return () => {
            const updated = (this.listeners.get(eventType) || []).filter((l) => l !== listener);
            this.listeners.set(eventType, updated);
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
    }
    async *toAsyncIterable() {
        const queue = [];
        let resolver = null;
        let done = false;
        const unsubs = [];
        const push = (evt) => {
            queue.push(evt);
            if (resolver) {
                resolver();
                resolver = null;
            }
            if (evt.type === "run_completed" || evt.type === "run_failed") {
                done = true;
            }
        };
        const types = [
            "agent_started",
            "text_stream",
            "tool_started",
            "tool_completed",
            "handoff_started",
            "guardrail_triggered",
            "retry",
            "run_completed",
            "run_failed",
        ];
        for (const t of types) {
            unsubs.push(this.on(t, push));
        }
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
            for (const unsub of unsubs)
                unsub();
        }
    }
}
//# sourceMappingURL=event-emitter.js.map