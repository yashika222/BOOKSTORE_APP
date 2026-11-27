'use server';

import { API_BASE_URL } from '@/lib/api/config';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface ResetActionInput {
  token: string;
  password: string;
  confirmPassword: string;
}

interface ResetActionResult {
  success: boolean;
  message: string;
}

export async function resetPasswordAction(
  input: ResetActionInput
): Promise<ResetActionResult> {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.resetLink}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      cache: 'no-store',
    });
    const result = (await response.json()) as ResetActionResult;
    return {
      success: response.ok && result.success === true,
      message: result.message || 'Unable to reset the password right now.',
    };
  } catch {
    return {
      success: false,
      message: 'Unable to reach the password reset service. Please try again.',
    };
  }
}
