'use server';

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
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
  try {
    const response = await fetch(`${apiUrl}/api/auth/reset-link`, {
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
