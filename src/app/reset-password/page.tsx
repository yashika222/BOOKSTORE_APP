'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, Button, Alert, message, Spin } from 'antd';
import { LockOutlined, SafetyCertificateOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import api from '@/lib/axios';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form] = Form.useForm();
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [validating, setValidating] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setValidating(false);
      return;
    }

    let isMounted = true;
    api
      .get(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.success) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setErrorMessage(res.data?.message || 'Invalid or expired reset token.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setTokenValid(false);
        setErrorMessage(
          err.response?.data?.message || 'This reset link has expired or is invalid.'
        );
      })
      .finally(() => {
        if (isMounted) setValidating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const onFinish = async (values: { otp: string; password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/api/auth/reset-password', {
        token,
        otp: values.otp.trim(),
        newPassword: values.password,
        confirmPassword: values.confirmPassword,
      });

      if (res.data?.success) {
        setResetSuccess(true);
        message.success('Password reset successfully! You can now log in.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setErrorMessage(res.data?.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Verification failed. Please check your OTP and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spin size="large" tip="Validating password reset link..." />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-md space-y-6 text-center">
          <Alert
            message="Invalid or Expired Link"
            description={
              errorMessage ||
              'This password reset link is invalid, incomplete, or has expired. Please request a new one.'
            }
            type="error"
            showIcon
            className="rounded-xl text-xs text-left"
          />
          <Link href="/forgot-password">
            <Button type="primary" block className="bg-violet-600 hover:bg-violet-700 font-bold h-11 text-sm mt-4">
              Request a New Reset Link
            </Button>
          </Link>
          <div className="pt-2">
            <Link href="/login" className="text-xs font-semibold text-gray-500 hover:text-violet-600">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center text-2xl mx-auto shadow-md">
            <SafetyCertificateOutlined />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Create New Password
          </h1>
          <p className="text-sm text-gray-500">
            Enter the 6-digit OTP sent to your email and set your new password.
          </p>
        </div>

        {errorMessage && (
          <Alert
            message="Reset Failed"
            description={errorMessage}
            type="error"
            showIcon
            className="rounded-xl text-xs"
          />
        )}

        {resetSuccess ? (
          <div className="space-y-4 text-center">
            <Alert
              message="Password Updated Successfully"
              description="Your password has been reset. Redirecting you to the login page..."
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
              className="rounded-xl text-xs text-left"
            />
            <Link href="/login">
              <Button type="primary" block className="bg-violet-600 hover:bg-violet-700 font-bold h-11 text-sm mt-4">
                Go to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <Form
            form={form}
            name="resetPasswordForm"
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className="space-y-4"
          >
            <Form.Item
              name="otp"
              label="6-Digit Verification Code (OTP)"
              rules={[
                { required: true, message: 'Please enter the 6-digit OTP from your email' },
                { pattern: /^\d{6}$/, message: 'OTP must be exactly 6 digits' },
              ]}
            >
              <Input
                placeholder="123456"
                maxLength={6}
                size="large"
                className="text-center text-lg tracking-widest font-mono"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="New Password"
              rules={[
                { required: true, message: 'Please enter your new password' },
                { min: 8, message: 'Password must be at least 8 characters' },
                {
                  pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
                  message: 'Must include at least one letter and one number',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="New password (min 8 chars)"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your new password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Re-enter new password"
                size="large"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              className="bg-violet-600 hover:bg-violet-700 font-bold h-11 text-sm shadow-md mt-2"
            >
              Confirm & Save Password
            </Button>
          </Form>
        )}

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-violet-600 transition"
          >
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
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spin size="large" tip="Loading reset page..." />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
