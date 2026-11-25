'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Alert, Button, Form, Input } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import styles from './AuthCard.module.css';

export function AuthPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.scene}>{children}</div>
    </div>
  );
}

function ShoppingIllustration() {
  return (
    <section className={styles.illustrationCard} aria-label="Online book shopping">
      <Image
        src="/auth-shopping-illustration.png"
        width={245}
        height={245}
        priority
        className={styles.illustration}
        alt="A woman reading while sitting in a shopping cart"
      />
      <p className={styles.illustrationCaption}>ONLINE BOOK SHOPPING</p>
    </section>
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
  const loginHref = `/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`;
  const signupHref = `/register${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`;

  return (
    <AuthPageFrame>
      <div className={styles.authGroup}>
        <ShoppingIllustration />
        <section className={styles.authPanel} aria-label={mode === 'login' ? 'Login' : 'Sign up'}>
          <nav className={styles.tabs} aria-label="Authentication">
            <Link href={loginHref} className={mode === 'login' ? styles.activeTab : styles.inactiveTab} aria-current={mode === 'login' ? 'page' : undefined}>
              LOGIN
              {mode === 'login' ? <span className={styles.activeMark} /> : null}
            </Link>
            <Link href={signupHref} className={mode === 'signup' ? styles.activeTab : styles.inactiveTab} aria-current={mode === 'signup' ? 'page' : undefined}>
              SIGNUP
              {mode === 'signup' ? <span className={styles.activeMark} /> : null}
            </Link>
          </nav>

          {errorMessage ? (
            <Alert type="error" message={errorMessage} className={styles.errorAlert} showIcon />
          ) : null}

          {mode === 'login' ? (
            <Form form={form} layout="vertical" requiredMark={false} onFinish={onLogin} className={styles.form}>
              <Form.Item name="email" label="Email Id" rules={[{ required: true, type: 'email' }]}>
                <Input autoComplete="email" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Enter password' }]}
              >
                <Input.Password
                  autoComplete="current-password"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>
              <div className={styles.forgotPassword}>
                <Link href="/forgot-password">Forgot Password?</Link>
              </div>
              <Button type="primary" htmlType="submit" block loading={loading} className={styles.submitButton}>
                Login
              </Button>
              <div className={styles.orDivider} aria-label="or">
                <span />
                <b>OR</b>
                <span />
              </div>
              <div className={styles.socialButtons}>
                <div className={styles.googleButton}>
                  <GoogleSignInButton nextPath={nextPath} compact />
                </div>
              </div>
            </Form>
          ) : (
            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              onFinish={onRegister}
              className={`${styles.form} ${styles.signupForm}`}
            >
              <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Enter full name' }]}>
                <Input autoComplete="name" />
              </Form.Item>
              <Form.Item name="email" label="Email Id" rules={[{ required: true, type: 'email' }]}>
                <Input autoComplete="email" />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Form.Item name="mobile" label="Mobile Number">
                <Input autoComplete="tel" inputMode="tel" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} className={styles.submitButton}>
                Signup
              </Button>
            </Form>
          )}
        </section>
      </div>
    </AuthPageFrame>
  );
}
