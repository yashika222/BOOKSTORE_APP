'use client';

import React from 'react';
import { Button } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { authService } from '@/lib/api';

export default function GoogleSignInButton({
  nextPath,
  compact,
}: {
  nextPath?: string;
  compact?: boolean;
}) {
  const startGoogleSignIn = () => {
    window.location.href = authService.googleSignInUrl(nextPath);
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
