'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Alert, Divider, message } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/authSlice';
import api from '@/lib/axios';

export default function RegisterPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onFinish = async (values: any) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/api/auth/register', {
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (res.data?.success && res.data?.user) {
        dispatch(setCredentials({ user: res.data.user }));
        message.success('Account created successfully! Welcome to PageTurner.');
        router.push('/books');
      } else {
        throw new Error(res.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center text-2xl mx-auto shadow-md">
            <BookOutlined />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Create an Account
          </h1>
          <p className="text-xs text-gray-500">
            Join PageTurner to save wishlists, view order queues, and buy books.
          </p>
        </div>

        {errorMessage && (
          <Alert
            message="Registration Error"
            description={errorMessage}
            type="error"
            showIcon
            className="rounded-xl text-xs"
          />
        )}

        <Form
          form={form}
          name="registerForm"
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="space-y-4"
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[
              { required: true, message: 'Please enter your full name' },
              { min: 2, message: 'Name must be at least 2 characters' },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="e.g. John Doe"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Enter a valid email address' },
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-gray-400" />}
              placeholder="e.g. john@example.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please create a password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="At least 6 characters"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Re-enter password"
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
            Create Customer Account
          </Button>
        </Form>

        <Divider className="my-2" />

        <div className="text-center text-xs text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-violet-600 hover:underline">
            Sign In here
          </Link>
        </div>

        <div className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
          <SafetyCertificateOutlined className="text-emerald-500" />
          <span>Passwords are salted & hashed using bcrypt before MongoDB storage</span>
        </div>
      </div>
    </div>
  );
}
