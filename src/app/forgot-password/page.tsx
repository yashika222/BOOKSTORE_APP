'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Form, Input, Button, Alert, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined, KeyOutlined } from '@ant-design/icons';
import api from '@/lib/axios';

export default function ForgotPasswordPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/api/auth/forgot-password', {
        email: values.email,
      });

      if (res.data?.success) {
        setSubmitted(true);
        setSubmittedEmail(values.email);
        message.success(res.data.message || 'Reset link sent! Please check your email.');
      } else {
        setErrorMessage(res.data?.message || 'Unable to send reset email. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Something went wrong. Please check your network or try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center text-2xl mx-auto shadow-md">
            <KeyOutlined />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Forgot Password?
          </h1>
          <p className="text-sm text-gray-500">
            Enter your registered email address and we will send you a reset link and a verification code.
          </p>
        </div>

        {errorMessage && (
          <Alert
            message="Request Failed"
            description={errorMessage}
            type="error"
            showIcon
            className="rounded-xl text-xs"
          />
        )}

        {submitted ? (
          <div className="space-y-4 text-center">
            <Alert
              message="Instructions Sent"
              description={`If an account is associated with ${submittedEmail}, you will receive an email with a secure link and a 6-digit OTP code.`}
              type="success"
              showIcon
              className="rounded-xl text-xs text-left"
            />
            <p className="text-xs text-gray-500">
              Check your inbox (and spam folder). After clicking the link in your email, enter your 6-digit verification code to set a new password.
            </p>
            <Link href="/login">
              <Button type="primary" block className="bg-violet-600 hover:bg-violet-700 font-bold h-11 text-sm mt-4">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <Form
            form={form}
            name="forgotPasswordForm"
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className="space-y-4"
          >
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter your registered email' },
                { type: 'email', message: 'Enter a valid email address' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="you@example.com"
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
              Send Reset Link & OTP
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
