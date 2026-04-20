import { z } from "zod";

/**
 * API Validation Schemas (Zod Implementation)
 * Provides robust, type-safe validation for all API inputs.
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 1. Responses API Schema
 */
const responsesSchema = z.object({
  offices: z.array(z.string()).min(1, "Invalid or missing 'offices' array"),
  month: z.string().min(1, "Invalid or missing 'month' string"),
  year: z.union([z.string(), z.number()]).transform((val) => String(val)).refine((val) => /^\d{4}$/.test(val), {
    message: "Year must be a 4-digit number",
  }),
});

export function validateResponsesInput(body: any): ValidationResult<{
  offices: string[];
  month: string;
  year: string;
}> {
  const result = responsesSchema.safeParse(body);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }
  return { success: true, data: result.data };
}

/**
 * 2. Dashboard API Schema
 */
const dashboardSchema = z.object({
  offices: z.array(z.string()).min(1, "Invalid or missing 'offices' array"),
  month: z.union([z.string(), z.array(z.string())]).refine(val => val.length > 0, {
    message: "Invalid or missing 'month' (string or array)"
  }),
  year: z.union([z.string(), z.number()]).transform((val) => String(val)),
});

export function validateDashboardInput(body: any): ValidationResult<{
  offices: string[];
  month: string | string[];
  year: string;
}> {
  const result = dashboardSchema.safeParse(body);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }
  return { success: true, data: result.data };
}

/**
 * 3. Physical Report Schema
 */
const physicalReportSchema = z.object({
  officeId: z.string().min(1, "Missing or invalid 'officeId'"),
  period_iso: z.string().regex(/^\d{4}-\d{2}$/, "Invalid 'period_iso'. Expected YYYY-MM format."),
  FOR_THE_MONTH_OF: z.string().min(1, "Missing 'FOR_THE_MONTH_OF' month name"),
  COLLECTED_FORMS: z.coerce.number(),
  VISITORS: z.coerce.number(),
  MALE: z.coerce.number(),
  FEMALE: z.coerce.number(),
  LGBTQ: z.coerce.number(),
  PREFER_NOT_TO_SAY: z.coerce.number(),
  CITIZEN: z.coerce.number(),
  BUSINESS: z.coerce.number(),
  GOVERNMENT: z.coerce.number(),
  YES: z.coerce.number(),
  JUST_NOW: z.coerce.number(),
  NO: z.coerce.number(),
  VISIBLE: z.coerce.number(),
  SOMEWHAT_VISIBLE: z.coerce.number(),
  DIFFICULT_TO_SEE: z.coerce.number(),
  NOT_VISIBLE: z.coerce.number(),
  NA: z.coerce.number(),
  VERY_MUCH: z.coerce.number(),
  SOMEWHAT: z.coerce.number(),
  DID_NOT_HELP: z.coerce.number(),
  NA2: z.coerce.number(),
}).passthrough(); // Allow other fields to pass through if necessary

export function validatePhysicalReportInput(body: any): ValidationResult<any> {
  const result = physicalReportSchema.safeParse(body);
  if (!result.success) {
    // Return the first specific error message found
    const err = result.error.errors[0];
    const message = err.code === 'invalid_type' ? `'${err.path[0]}' must be a valid number` : err.message;
    return { success: false, error: message };
  }
  return { success: true, data: result.data };
}

/**
 * 4. User Core Schema
 */
const userBaseSchema = z.object({
  idno: z.string().min(1, "Missing or invalid 'idno'"),
  full_name: z.string().min(1, "Missing or invalid 'full_name'"),
  position: z.string().default("Unknown"),
  office: z.string().default("Unknown"),
  user_type: z.enum(["Super Admin", "Office Admin"], {
    errorMap: () => ({ message: "user_type must be 'Super Admin' or 'Office Admin'" })
  }),
  office_assignment: z.array(z.string()).default([]),
  is_analytics_enabled: z.boolean().optional()
});

export function validateUserInput(body: any): ValidationResult<z.infer<typeof userBaseSchema>> {
  const result = userBaseSchema.safeParse(body);
  if (!result.success) return { success: false, error: result.error.errors[0].message };
  return { success: true, data: result.data };
}

/**
 * 5. User Analytics Patch Schema
 */
const userAnalyticsPatchSchema = z.object({
  analyticsEnabled: z.boolean({
    required_error: "Missing 'analyticsEnabled'",
    invalid_type_error: "analyticsEnabled must be a boolean",
  }),
});

export function validateUserPatchInput(body: any): ValidationResult<{ analyticsEnabled: boolean }> {
  const result = userAnalyticsPatchSchema.safeParse(body);
  if (!result.success) return { success: false, error: result.error.errors[0].message };
  return { success: true, data: result.data };
}

/**
 * 6. Office Assignment Schema
 */
const officeAssignmentSchema = z.object({
  idno: z.string().min(1, "Missing or invalid 'idno'"),
  offices: z.array(z.string()).min(1, "Offices array cannot be empty"),
});

export function validateOfficeAssignmentInput(body: any): ValidationResult<{ idno: string, offices: string[] }> {
  const result = officeAssignmentSchema.safeParse(body);
  if (!result.success) return { success: false, error: result.error.errors[0].message };
  return { success: true, data: result.data };
}

/**
 * 7. Office Schema
 */
const officeSchema = z.object({
  name: z.string().min(1, "Missing or invalid 'name'"),
  fullName: z.string().min(1, "Missing or invalid 'fullName'"),
  status: z.string().optional(),
  id: z.string().optional()
});

export function validateOfficeInput(body: any): ValidationResult<z.infer<typeof officeSchema>> {
  const result = officeSchema.safeParse(body);
  if (!result.success) return { success: false, error: result.error.errors[0].message };
  return { success: true, data: result.data };
}

/**
 * 8. Login Schema
 */
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export function validateLoginInput(body: any): ValidationResult<z.infer<typeof loginSchema>> {
  const result = loginSchema.safeParse(body);
  if (!result.success) return { success: false, error: result.error.errors[0].message };
  return { success: true, data: result.data };
}

/**
 * 9. Change Password Schema
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export function validateChangePasswordInput(body: any): ValidationResult<z.infer<typeof changePasswordSchema>> {
  const result = changePasswordSchema.safeParse(body);
  if (!result.success) return { success: false, error: result.error.errors[0].message };
  return { success: true, data: result.data };
}

/**
 * 10. Classification Assignment Schema
 */
const classificationSchema = z.object({
  assignments: z.array(
    z.object({
      docId: z.string().min(1, "Missing comment ID"),
      classification: z.string().min(1, "Missing new category"),
    })
  ).min(1, "Assignments array cannot be empty"),
});

export function validateClassificationInput(body: any): ValidationResult<z.infer<typeof classificationSchema>> {
  const result = classificationSchema.safeParse(body);
  if (!result.success) return { success: false, error: result.error.errors[0].message };
  return { success: true, data: result.data };
}
