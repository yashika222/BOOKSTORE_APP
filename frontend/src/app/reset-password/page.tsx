'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Form, Input, Spin, message } from 'antd';
import { ArrowLeftOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { authService } from '@/lib/api';

function ResetPasswordContent() {
  const router = useRouter();
  const email = useSearchParams().get('email')?.trim().toLowerCase() || '';
  const [form] = Form.useForm();
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verifyOtp = async (values: { otp: string }) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await authService.verifyResetOtp({
        email,
        otp: values.otp.trim(),
      });
      form.resetFields();
      setStep('password');
      message.success('Code verified. Choose your new password.');
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to verify that code.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (values: { password: string; confirmPassword: string }) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await authService.resetPassword({
        newPassword: values.password,
        confirmPassword: values.confirmPassword,
      });
      setResetSuccess(true);
      message.success('Password changed successfully.');
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to change your password.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await authService.resendResetPassword(email);
      message.success(response?.message || 'If your email is registered, a new code has been sent.');
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to resend the code.');
    } finally {
      setLoading(false);
    }
  };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return (
      <div className="customer-page mx-auto max-w-md px-4 py-16">
        <Alert
          type="error"
          showIcon
          message="Email address missing"
          description="Start the password reset again and enter the email address for your account."
          action={
            <Link href="/forgot-password">
              <Button type="primary" className="bg-[#a03037]">Request a code</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="customer-page mx-auto max-w-md px-4 py-16">
      <div className="space-y-6 rounded-3xl border border-gray-200/80 bg-white p-8 shadow-md">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#a03037] text-2xl text-white shadow-md">
            <SafetyCertificateOutlined />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            {step === 'otp' ? 'Verify Your Email' : 'Create New Password'}
          </h1>
          <p className="text-sm text-gray-500">
            {step === 'otp'
              ? `Enter the 6-digit code sent to ${email}.`
              : 'Your code is verified. Enter and confirm your new password.'}
          </p>
        </div>

        {errorMessage ? (
          <Alert message="Password reset" description={errorMessage} type="error" showIcon />
        ) : null}

        {resetSuccess ? (
          <div className="space-y-4 text-center">
            <Alert
              message="Password Updated"
              description="Your password has been changed. You can now sign in with your new password."
              type="success"
              showIcon
            />
            <Button
              type="primary"
              block
              className="h-11 bg-[#a03037] font-bold"
              onClick={() => router.push('/login')}
            >
              Go to Sign In
            </Button>
          </div>
        ) : step === 'otp' ? (
          <Form form={form} layout="vertical" onFinish={verifyOtp} requiredMark={false}>
            <Form.Item
              name="otp"
              label="6-Digit Verification Code"
              rules={[
                { required: true, message: 'Enter the code from your email.' },
                { pattern: /^\d{6}$/, message: 'The code must be exactly 6 digits.' },
              ]}
            >
              <Input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                size="large"
                className="text-center font-mono text-lg tracking-widest"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} className="h-11 bg-[#a03037] font-bold">
              Verify Code
            </Button>
            <Button type="link" block disabled={loading} onClick={() => void resendOtp()}>
              Resend code
            </Button>
          </Form>
        ) : (
          <Form form={form} layout="vertical" onFinish={resetPassword} requiredMark={false}>
            <Form.Item
              name="password"
              label="New Password"
              rules={[
                { required: true, message: 'Enter your new password.' },
                { min: 8, message: 'Password must be at least 8 characters.' },
                { pattern: /^(?=.*[A-Za-z])(?=.*\d)/, message: 'Include at least one letter and one number.' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                autoComplete="new-password"
                placeholder="New password"
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Confirm your new password.' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('The passwords do not match.'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                autoComplete="new-password"
                placeholder="Confirm new password"
                size="large"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} className="h-11 bg-[#a03037] font-bold">
              Change Password
            </Button>
          </Form>
        )}

        <div className="pt-2 text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <ArrowLeftOutlined />
            <span>Return to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><Spin size="large" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
