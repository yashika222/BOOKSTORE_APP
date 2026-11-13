'use client';

import React from 'react';
import { Button } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';

export default function GoogleSignInButton({
  nextPath,
  compact,
}: {
  nextPath?: string;
  compact?: boolean;
}) {
  const startGoogleSignIn = () => {
    const params = new URLSearchParams();
    if (nextPath) params.set('next', nextPath);
    const query = params.toString();
    window.location.href = query ? `/api/auth/google?${query}` : '/api/auth/google';
  };

  return (
    <Button
      size="large"
      block
      icon={compact ? undefined : <GoogleOutlined />}
      onClick={startGoogleSignIn}
      className={compact ? 'h-10' : 'h-11 font-semibold'}
    >
      {compact ? 'Google' : 'Continue with Google'}
    </Button>
  );
}
