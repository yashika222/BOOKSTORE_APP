'use client';

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App as AntdApp } from 'antd';
import ThemeProvider from '@/lib/theme';

export default function AntdRegistryWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AntdRegistry>
      <ThemeProvider>
        <AntdApp>{children}</AntdApp>
      </ThemeProvider>
    </AntdRegistry>
  );
}
