import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export interface ValidatorRule {
  type: "string" | "number" | "boolean" | "email" | "mac" | "array";
  required?: boolean;
  min?: number;
  max?: number;
  regex?: RegExp;
  custom?: (value: any) => boolean;
}

export interface ValidationSchema {
  body?: Record<string, ValidatorRule>;
  query?: Record<string, ValidatorRule>;
  params?: Record<string, ValidatorRule>;
}

/**
 * Validates target fields of a request object (body, query, params) against a declaration schema.
 */
function validateField(value: any, rule: ValidatorRule, fieldPath: string): string | null {
  if (value === undefined || value === null || value === "") {
    if (rule.required) {
      return `The field '${fieldPath}' is required.`;
    }
    return null;
  }

  // Type assertion checks
  switch (rule.type) {
    case "number":
      const parsedNum = Number(value);
      if (isNaN(parsedNum)) {
        return `The field '${fieldPath}' must be a valid number.`;
      }
      if (rule.min !== undefined && parsedNum < rule.min) {
        return `The field '${fieldPath}' must be at least ${rule.min}.`;
      }
      if (rule.max !== undefined && parsedNum > rule.max) {
        return `The field '${fieldPath}' cannot exceed ${rule.max}.`;
      }
      break;

    case "boolean":
      if (typeof value !== "boolean" && value !== "true" && value !== "false") {
        return `The field '${fieldPath}' must be a boolean.`;
      }
      break;

    case "string":
      if (typeof value !== "string") {
        return `The field '${fieldPath}' must be a string.`;
      }
      if (rule.min !== undefined && value.length < rule.min) {
        return `The field '${fieldPath}' must be at least ${rule.min} characters long.`;
      }
      if (rule.max !== undefined && value.length > rule.max) {
        return `The field '${fieldPath}' cannot exceed ${rule.max} characters long.`;
      }
      if (rule.regex && !rule.regex.test(value)) {
        return `The field '${fieldPath}' format is invalid.`;
      }
      break;

    case "email":
      if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return `The field '${fieldPath}' must be a valid email address.`;
      }
      break;

    case "mac":
      if (
        typeof value !== "string" ||
        !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(value)
      ) {
        return `The field '${fieldPath}' must be a valid MAC address (e.g. AA:BB:CC:DD:EE:FF).`;
      }
      break;

    case "array":
      if (!Array.isArray(value)) {
        return `The field '${fieldPath}' must be an array.`;
      }
      break;
  }

  if (rule.custom && !rule.custom(value)) {
    return `The field '${fieldPath}' failed custom business rule validations.`;
  }

  return null;
}

/**
 * Express middleware generator for declarative validation schemas
 */
export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrors: string[] = [];

    // 1. Validate Body
    if (schema.body) {
      Object.entries(schema.body).forEach(([field, rule]) => {
        const error = validateField(req.body?.[field], rule, `body.${field}`);
        if (error) validationErrors.push(error);
      });
    }

    // 2. Validate Query Parameters
    if (schema.query) {
      Object.entries(schema.query).forEach(([field, rule]) => {
        const error = validateField(req.query?.[field], rule, `query.${field}`);
        if (error) validationErrors.push(error);
      });
    }

    // 3. Validate URL Params
    if (schema.params) {
      Object.entries(schema.params).forEach(([field, rule]) => {
        const error = validateField(req.params?.[field], rule, `params.${field}`);
        if (error) validationErrors.push(error);
      });
    }

    if (validationErrors.length > 0) {
      // Throw operational error
      return next(
        new AppError(
          "Request validation failed.",
          400,
          "VALIDATION_ERROR",
          validationErrors
        )
      );
    }

    next();
  };
}

export default validateRequest;
