'use client';

import Link from 'next/link';
import { Form, Input, Button, Alert } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

function ShoppingIllustration() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-md bg-white px-8 py-10 text-center shadow-sm dark:bg-[#1c1c1c]">
      <div className="flex h-56 w-56 items-center justify-center rounded-full bg-[#4a90e2]">
        <svg viewBox="0 0 180 180" className="h-44 w-44" aria-hidden>
          <circle cx="90" cy="90" r="88" fill="#4A90E2" />
          <rect x="48" y="78" width="84" height="62" rx="8" fill="#fff" />
          <path d="M60 78c8-28 52-28 60 0" fill="none" stroke="#fff" strokeWidth="8" />
          <circle cx="78" cy="150" r="8" fill="#2c3e50" />
          <circle cx="118" cy="150" r="8" fill="#2c3e50" />
          <circle cx="118" cy="62" r="16" fill="#f7c7a8" />
          <rect x="108" y="76" width="20" height="28" fill="#5b7cfa" />
        </svg>
      </div>
      <p className="mt-6 text-lg font-bold tracking-wide text-[#333] dark:text-white">ONLINE BOOK SHOPPING</p>
    </div>
  );
}

export default function AuthCard({
  mode,
  nextPath,
  loading,
  errorMessage,
  onLogin,
  onRegister,
}: {
  mode: 'login' | 'signup';
  nextPath?: string;
  loading?: boolean;
  errorMessage?: string | null;
  onLogin?: (values: { email: string; password: string }) => void;
  onRegister?: (values: { name: string; email: string; password: string; mobile?: string }) => void;
}) {
  const [form] = Form.useForm();

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#cfcfcf] px-4 py-10 dark:bg-[#0f0f0f]">
      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden md:grid-cols-2">
        <ShoppingIllustration />
        <div className="bg-white px-8 py-8 shadow-sm dark:bg-[#1c1c1c]">
          <div className="mb-6 flex items-end gap-8 text-[22px] font-semibold tracking-wide">
            <Link
              href={`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
              className={mode === 'login' ? 'text-[#111] dark:text-white' : 'text-[#bdbdbd]'}
            >
              LOGIN
              {mode === 'login' ? <span className="mt-1 block h-0.5 w-12 bg-[#a03037]" /> : null}
            </Link>
            <Link
              href={`/register${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
              className={mode === 'signup' ? 'text-[#111] dark:text-white' : 'text-[#bdbdbd]'}
            >
              SIGNUP
              {mode === 'signup' ? <span className="mt-1 block h-0.5 w-12 bg-[#a03037]" /> : null}
            </Link>
          </div>

          {errorMessage ? (
            <Alert type="error" message={errorMessage} className="mb-4" showIcon />
          ) : null}

          {mode === 'login' ? (
            <Form form={form} layout="vertical" requiredMark={false} onFinish={onLogin}>
              <Form.Item name="email" label="Email Id" rules={[{ required: true, type: 'email' }]}>
                <Input />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Enter password' }]}
              >
                <Input.Password
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>
              <div className="-mt-3 mb-4 text-right">
                <Link href="/forgot-password" className="text-xs text-[#a03037]">
                  Forgot password?
                </Link>
              </div>
              <Button type="primary" htmlType="submit" block loading={loading} className="h-10 bg-[#a03037]">
                Login
              </Button>
              <p className="my-4 text-center text-xs uppercase tracking-[0.2em] text-[#9a9a9a]">OR</p>
              <GoogleSignInButton nextPath={nextPath} />
            </Form>
          ) : (
            <Form form={form} layout="vertical" requiredMark={false} onFinish={onRegister}>
              <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Enter full name' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="email" label="Email Id" rules={[{ required: true, type: 'email' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
                <Input.Password />
              </Form.Item>
              <Form.Item name="mobile" label="Mobile Number">
                <Input />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} className="h-10 bg-[#a03037]">
                Signup
              </Button>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
