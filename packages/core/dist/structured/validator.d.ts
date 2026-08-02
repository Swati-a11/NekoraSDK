import { StructureValidationResult, StructuredOutputOptions } from "./types.js";
export declare class StructuredOutputValidator<T> {
    private schema;
    constructor(options: StructuredOutputOptions<T>);
    static extractJson(text: string): string;
    parse(rawText: string): StructureValidationResult<T>;
}
//# sourceMappingURL=validator.d.ts.map