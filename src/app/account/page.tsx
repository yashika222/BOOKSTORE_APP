'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, Descriptions, Button, Form, Input, Divider, Alert, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, ShoppingOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/authSlice';
import api from '@/lib/axios';

export default function AccountPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateName = async (values: { name: string }) => {
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const res = await api.patch('/api/account', { name: values.name.trim() });
      if (res.data?.success && res.data?.user) {
        dispatch(setCredentials({ user: res.data.user }));
        setProfileSuccess('Profile name updated successfully.');
        message.success('Profile updated.');
      } else {
        setProfileError(res.data?.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.message || err.message || 'Error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const res = await api.patch('/api/account', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (res.data?.success) {
        setPasswordSuccess('Password changed successfully.');
        passwordForm.resetFields();
        message.success('Password changed.');
      } else {
        setPasswordError(res.data?.message || 'Failed to change password.');
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || err.message || 'Error changing password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Account</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your profile information, password, and order history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="rounded-2xl border-gray-200 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-2xl mx-auto mb-3 font-bold">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name || 'Reader'}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="mt-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                {user?.role === 'admin' ? 'Administrator' : 'Customer Account'}
              </span>
            </div>
            <Divider className="my-4" />
            <Link href="/orders">
              <Button icon={<ShoppingOutlined />} block className="font-medium">
                View Your Orders
              </Button>
            </Link>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-2xl border-gray-200 shadow-sm" title="Account Overview">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Full Name">{user?.name}</Descriptions.Item>
              <Descriptions.Item label="Email Address">{user?.email}</Descriptions.Item>
              <Descriptions.Item label="Role">{user?.role === 'admin' ? 'Admin' : 'Customer'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card className="rounded-2xl border-gray-200 shadow-sm" title="Update Profile Details">
            {profileSuccess && (
              <Alert message={profileSuccess} type="success" showIcon className="mb-4 rounded-xl text-xs" />
            )}
            {profileError && (
              <Alert message={profileError} type="error" showIcon className="mb-4 rounded-xl text-xs" />
            )}
            <Form
              form={profileForm}
              layout="vertical"
              initialValues={{ name: user?.name }}
              onFinish={handleUpdateName}
              requiredMark={false}
            >
              <Form.Item
                name="name"
                label="Full Name"
                rules={[
                  { required: true, message: 'Please enter your name' },
                  { min: 2, message: 'Name must be at least 2 characters' },
                ]}
              >
                <Input prefix={<UserOutlined className="text-gray-400" />} size="large" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={savingProfile}
                className="bg-violet-600 hover:bg-violet-700 font-semibold"
              >
                Save Profile Changes
              </Button>
            </Form>
          </Card>

          <Card className="rounded-2xl border-gray-200 shadow-sm" title="Change Password">
            {passwordSuccess && (
              <Alert message={passwordSuccess} type="success" showIcon className="mb-4 rounded-xl text-xs" />
            )}
            {passwordError && (
              <Alert message={passwordError} type="error" showIcon className="mb-4 rounded-xl text-xs" />
            )}
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
              requiredMark={false}
              className="space-y-3"
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true, message: 'Please enter your current password' }]}
              >
                <Input.Password prefix={<LockOutlined className="text-gray-400" />} size="large" />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter a new password' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                  {
                    pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
                    message: 'Must include at least one letter and one number',
                  },
                ]}
              >
                <Input.Password prefix={<LockOutlined className="text-gray-400" />} size="large" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined className="text-gray-400" />} size="large" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={savingPassword}
                className="bg-violet-600 hover:bg-violet-700 font-semibold"
              >
                Update Password
              </Button>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}
