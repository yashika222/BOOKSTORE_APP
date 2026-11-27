import Link from 'next/link';
import { Alert, Button } from 'antd';
import { API_BASE_URL } from '@/lib/api/config';
import ResetLinkForm from './ResetLinkForm';

interface ResetPasswordPageProps {
  searchParams: { token?: string };
}

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const token = searchParams.token || '';
  if (!token) {
    return (
      <div className="customer-page mx-auto max-w-md px-4 py-16">
        <Alert
          type="info"
          showIcon
          message="A reset link is required"
          description="Request a password reset link by email, then open that link to choose a new password."
          action={
            <Link href="/forgot-password">
              <Button type="primary" className="bg-[#a03037]">Request reset link</Button>
            </Link>
          }
        />
      </div>
    );
  }

  let linkMessage = 'This reset link is invalid or expired.';
  let linkDescription =
    'This link may have expired or already been used. Request a new reset link to continue.';
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/auth/reset-link?token=${encodeURIComponent(token)}`,
      { cache: 'no-store' }
    );
    if (response.ok) return <ResetLinkForm token={token} />;
    if (response.status >= 500) {
      linkMessage = 'Unable to validate this reset link right now.';
      linkDescription = 'Please try again in a moment or request another reset link.';
    }
  } catch {
    linkMessage = 'Unable to validate this reset link right now.';
    linkDescription = 'Please try again in a moment or request another reset link.';
  }

  return (
    <div className="customer-page mx-auto max-w-md px-4 py-16">
      <Alert
        type="error"
        showIcon
        message={linkMessage}
        description={linkDescription}
        action={
          <Link href="/forgot-password">
            <Button type="primary" className="bg-[#a03037]">Request another link</Button>
          </Link>
        }
      />
    </div>
  );
}
