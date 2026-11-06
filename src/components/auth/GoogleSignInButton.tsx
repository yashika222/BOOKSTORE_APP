'use client';

import React from 'react';
import { Button } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';

export default function GoogleSignInButton({ nextPath }: { nextPath?: string }) {
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
      icon={<GoogleOutlined />}
      onClick={startGoogleSignIn}
      className="h-11 font-semibold"
    >
      Continue with Google
    </Button>
  );
}
