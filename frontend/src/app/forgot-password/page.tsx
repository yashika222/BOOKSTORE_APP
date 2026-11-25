'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Alert, message } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { authService } from '@/lib/api';
import styles from './ForgotPassword.module.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await authService.forgotPassword(values.email);
      if (res?.success) {
        message.success('If your email is registered, a one-time code has been sent.');
        router.push(`/reset-password?email=${encodeURIComponent(values.email.trim().toLowerCase())}`);
      } else {
        setErrorMessage(res?.message || 'Unable to send reset email.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Bookstore home">
            <BookOutlined aria-hidden="true" />
            <span>Bookstore</span>
          </Link>
        </header>

        <div className={styles.content}>
          <h1 className={styles.heading}>Forgot Your Password?</h1>
          <section className={styles.card} aria-label="Reset your password">
            <div className={styles.cardBody}>
              <p className={styles.description}>
                Enter your email address and we&apos;ll send you
                <br />
                a link to reset your password.
              </p>
              {errorMessage ? (
                <Alert type="error" message={errorMessage} className={styles.errorAlert} showIcon />
              ) : null}
              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                onFinish={onFinish}
                className={styles.form}
              >
                <label className={styles.emailLabel} htmlFor="forgot-password-email">
                  Email Id
                </label>
                <Form.Item
                  name="email"
                  rules={[{ required: true, type: 'email' }]}
                  className={styles.emailItem}
                >
                  <Input
                    id="forgot-password-email"
                    autoComplete="email"
                    className={styles.emailInput}
                  />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className={styles.resetButton}
                >
                  Reset Password
                </Button>
              </Form>
            </div>

            <div className={styles.createAccount}>
              <Link href="/register">CREATE ACCOUNT</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
