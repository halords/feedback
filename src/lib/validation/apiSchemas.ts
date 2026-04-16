/**
 * API Validation Schemas (Vanilla Implementation)
 * This provides a similar interface to Zod for strict input validation.
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validates the responses API input
 */
export function validateResponsesInput(body: any): ValidationResult<{
  offices: string[];
  month: string;
  year: string;
}> {
  const { offices, month, year } = body;

  if (!offices || !Array.isArray(offices) || offices.length === 0) {
    return { success: false, error: "Invalid or missing 'offices' array" };
  }

  if (!month || typeof month !== 'string') {
    return { success: false, error: "Invalid or missing 'month' string" };
  }

  if (!year || (typeof year !== 'string' && typeof year !== 'number')) {
    return { success: false, error: "Invalid or missing 'year'" };
  }

  // Normalize year to string
  const normalizedYear = String(year);
  if (!/^\d{4}$/.test(normalizedYear)) {
    return { success: false, error: "Year must be a 4-digit number" };
  }

  return {
    success: true,
    data: { offices, month, year: normalizedYear }
  };
}

/**
 * Validates the dashboard API input
 */
export function validateDashboardInput(body: any): ValidationResult<{
  offices: string[];
  month: string | string[];
  year: string;
}> {
  const { offices, month, year } = body;

  if (!offices || !Array.isArray(offices) || offices.length === 0) {
    return { success: false, error: "Invalid or missing 'offices' array" };
  }

  if (!month || (typeof month !== 'string' && !Array.isArray(month))) {
    return { success: false, error: "Invalid or missing 'month' (string or array)" };
  }

  if (!year || (typeof year !== 'string' && typeof year !== 'number')) {
    return { success: false, error: "Invalid or missing 'year'" };
  }

  return {
    success: true,
    data: { offices, month, year: String(year) }
  };
}

/**
 * Validates physical report input
 */
export function validatePhysicalReportInput(body: any): ValidationResult<any> {
  const { 
    officeId, 
    period_iso, 
    FOR_THE_MONTH_OF, 
    COLLECTED_FORMS, 
    VISITORS,
    MALE, FEMALE, LGBTQ, PREFER_NOT_TO_SAY,
    CITIZEN, BUSINESS, GOVERNMENT,
    YES, JUST_NOW, NO,
    VISIBLE, SOMEWHAT_VISIBLE, DIFFICULT_TO_SEE, NOT_VISIBLE, NA,
    VERY_MUCH, SOMEWHAT, DID_NOT_HELP, NA2
  } = body;

  // 1. Core Identity & Timing
  if (!officeId || typeof officeId !== 'string') {
    return { success: false, error: "Missing or invalid 'officeId'" };
  }
  if (!period_iso || !/^\d{4}-\d{2}$/.test(period_iso)) {
    return { success: false, error: "Invalid 'period_iso'. Expected YYYY-MM format." };
  }
  if (!FOR_THE_MONTH_OF || typeof FOR_THE_MONTH_OF !== 'string') {
    return { success: false, error: "Missing 'FOR_THE_MONTH_OF' month name" };
  }

  // 2. Numeric Validation Utility
  const validateNumeric = (val: any, name: string) => {
    const num = Number(val);
    if (isNaN(num)) return { success: false, error: `'${name}' must be a valid number` };
    return { success: true, value: num };
  };

  // 3. Batch validate numbers
  const numericFields: Record<string, any> = {
    COLLECTED_FORMS, VISITORS,
    MALE, FEMALE, LGBTQ, PREFER_NOT_TO_SAY,
    CITIZEN, BUSINESS, GOVERNMENT,
    YES, JUST_NOW, NO,
    VISIBLE, SOMEWHAT_VISIBLE, DIFFICULT_TO_SEE, NOT_VISIBLE, NA,
    VERY_MUCH, SOMEWHAT, DID_NOT_HELP, NA2
  };

  const validatedData: any = { ...body };

  for (const [key, val] of Object.entries(numericFields)) {
    if (val === undefined || val === null) continue; // Allow optionality during partial updates if needed
    const result = validateNumeric(val, key);
    if (!result.success) return result;
    validatedData[key] = result.value;
  }

  return {
    success: true,
    data: validatedData
  };
}
