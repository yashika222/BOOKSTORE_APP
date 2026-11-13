'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Alert, message } from 'antd';
import api from '@/lib/axios';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/api/auth/forgot-password', { email: values.email });
      if (res.data?.success) {
        message.success('If your email is registered, a one-time code has been sent.');
        router.push(`/reset-password?email=${encodeURIComponent(values.email.trim().toLowerCase())}`);
      } else {
        setErrorMessage(res.data?.message || 'Unable to send reset email.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-start justify-center bg-white px-4 py-16 dark:bg-[var(--background)]">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Forgot Your Password?</h1>
        <div className="border border-[var(--border)] bg-[var(--card)] p-8">
          <p className="mb-6 text-center text-sm text-[var(--muted)]">
            Enter your account email and we&apos;ll send you a one-time code. You&apos;ll verify it before choosing a new password.
          </p>
          {errorMessage ? <Alert type="error" message={errorMessage} className="mb-4" showIcon /> : null}
          <Form form={form} layout="vertical" requiredMark={false} onFinish={onFinish}>
            <Form.Item name="email" label="Email Id" rules={[{ required: true, type: 'email' }]}>
              <Input autoComplete="email" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} className="h-10 bg-[#a03037]">
              Send Reset Code
            </Button>
          </Form>
        </div>
        <div className="border border-t-0 border-[var(--border)] bg-[#f7f7f7] py-4 text-center dark:bg-[#1a1a1a]">
          <Link href="/register" className="text-sm font-semibold tracking-wide text-[#111] dark:text-white">
            CREATE ACCOUNT
          </Link>
        </div>
      </div>
    </div>
  );
}
