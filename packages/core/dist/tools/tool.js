import { z } from "zod";
import { ToolValidationError, ToolExecutionError, } from "./types.js";
/**
 * Define a type-safe tool for Nekora AI agents with Zod validation.
 */
export function tool(config) {
    const jsonSchema = config.schema instanceof z.ZodType
        ? zodToJsonSchema(config.schema)
        : { type: "object", properties: {} };
    return {
        name: config.name,
        description: config.description,
        schema: config.schema,
        permissions: config.permissions,
        requireApproval: config.requireApproval,
        metadata: config.metadata,
        parameters: jsonSchema,
        toDefinition() {
            return {
                name: config.name,
                description: config.description,
                parameters: jsonSchema,
            };
        },
        async execute(input, context) {
            let validatedArgs = input;
            if (config.schema) {
                if (typeof input === "string") {
                    try {
                        const parsed = JSON.parse(input);
                        validatedArgs = config.schema.parse(parsed);
                    }
                    catch {
                        try {
                            validatedArgs = config.schema.parse(input);
                        }
                        catch (err) {
                            const msg = err instanceof Error ? err.message : String(err);
                            throw new ToolValidationError(config.name, msg);
                        }
                    }
                }
                else {
                    try {
                        validatedArgs = config.schema.parse(input);
                    }
                    catch (err) {
                        const msg = err instanceof Error ? err.message : String(err);
                        throw new ToolValidationError(config.name, msg);
                    }
                }
            }
            const effectiveContext = context || {
                runId: `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            };
            try {
                return await config.execute(validatedArgs, effectiveContext);
            }
            catch (err) {
                if (err instanceof ToolValidationError)
                    throw err;
                const msg = err instanceof Error ? err.message : String(err);
                throw new ToolExecutionError(msg, config.name, err);
            }
        },
    };
}
function zodToJsonSchema(schema) {
    if (schema instanceof z.ZodObject) {
        const shape = schema.shape;
        const properties = {};
        const required = [];
        for (const key in shape) {
            const field = shape[key];
            properties[key] = zodFieldToJsonSchema(field);
            if (!field.isOptional()) {
                required.push(key);
            }
        }
        return {
            type: "object",
            properties,
            required: required.length > 0 ? required : undefined,
        };
    }
    return { type: "object", properties: {} };
}
function zodFieldToJsonSchema(field) {
    let description = field._def?.description;
    if (field instanceof z.ZodString) {
        return { type: "string", description };
    }
    if (field instanceof z.ZodNumber) {
        return { type: "number", description };
    }
    if (field instanceof z.ZodBoolean) {
        return { type: "boolean", description };
    }
    if (field instanceof z.ZodArray) {
        return {
            type: "array",
            items: zodFieldToJsonSchema(field._def.type),
            description,
        };
    }
    if (field instanceof z.ZodOptional || field instanceof z.ZodNullable) {
        return zodFieldToJsonSchema(field._def.innerType);
    }
    if (field instanceof z.ZodEnum) {
        return { type: "string", enum: field._def.values, description };
    }
    return { type: "string", description };
}
//# sourceMappingURL=tool.js.map