import { z } from "zod";

export interface StructureValidationResult<T> {
  success: boolean;
  data?: T;
  error?: z.ZodError;
  rawText: string;
  repairPrompt?: string;
}

export interface StructuredOutputOptions<T> {
  schema: z.ZodType<T>;
  name?: string;
  description?: string;
}
