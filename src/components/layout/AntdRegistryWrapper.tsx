'use client';

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App as AntdApp } from 'antd';

export default function AntdRegistryWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#7c3aed', // Elegant Violet primary
            colorLink: '#7c3aed',
            borderRadius: 8,
            fontFamily:
              'var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          components: {
            Button: {
              controlHeight: 40,
              borderRadius: 8,
            },
            Input: {
              controlHeight: 40,
              borderRadius: 8,
            },
            Card: {
              borderRadiusLG: 12,
            },
          },
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </AntdRegistry>
  );
}
