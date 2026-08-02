import { Message } from "../../../providers/types.js";
export declare class ShortTermMemoryManager {
    private sessions;
    private maxMessages;
    constructor(maxMessages?: number);
    addMessage(sessionId: string, message: Message): Promise<void>;
    getMessages(sessionId: string): Promise<Message[]>;
    clearSession(sessionId: string): Promise<void>;
}
//# sourceMappingURL=short-term.manager.d.ts.map