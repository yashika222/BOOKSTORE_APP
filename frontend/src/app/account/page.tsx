'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Checkbox, Form, Input, message, Radio } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import type { IAddress } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout, setCredentials } from '@/store/authSlice';
import { accountService, addressesService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { broadcastAuthTabEvent } from '@/lib/api/authEvents';
import { clearSessionHint } from '@/lib/api';

interface AddressFormValues {  fullName: string;
  mobile: string;
  pincode: string;
  locality: string;
  addressLine: string;
  city: string;
  state: string;
  addressType: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = response.data;
      if (
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof data.message === 'string'
      ) {
        return data.message;
      }
    }
  }
  return error instanceof Error ? error.message : fallback;
}

function DisplayField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-[12px] text-[#4d4d4d]">{label}</label>
      {multiline ? (
        <Input.TextArea
          disabled
          rows={2}
          value={value}
          className="!resize-none !bg-[#f5f5f5]"
        />
      ) : (
        <Input disabled value={value} className="!h-[40px] !bg-[#f5f5f5]" />
      )}
    </div>
  );
}

function AddressDetails({ address }: { address: IAddress }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <DisplayField label="Full Name" value={address.fullName} />
        <DisplayField label="Mobile Number" value={address.mobile} />
      </div>
      <DisplayField
        label="Address"
        value={[address.addressLine, address.locality].filter(Boolean).join(', ')}
        multiline
      />
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <DisplayField label="City/Town" value={address.city} />
        <DisplayField label="State" value={address.state} />
        <DisplayField label="PIN Code" value={address.pincode} />
      </div>
      <div className="mt-1">
        <label className="mb-2 block text-[12px] text-[#4d4d4d]">Type</label>
        <Radio.Group disabled value={address.addressType}>
          <Radio value="Home">Home</Radio>
          <Radio value="Work">Work</Radio>
          <Radio value="Other">Other</Radio>
        </Radio.Group>
      </div>
      {address.isDefault && (
        <div className="mt-3 text-[12px] font-medium text-[#a03037]">
          Default address
        </div>
      )}
    </>
  );
}

export default function AccountPage() {
  const dispatch = useAppDispatch();
  const { user, sessionExpiresAt } = useAppSelector((state) => state.auth);
  const router = useRouter();

  const [profileForm] = Form.useForm<{ name: string }>();
  const [passwordForm] = Form.useForm();
  const [addressForm] = Form.useForm<AddressFormValues>();
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesError, setAddressesError] = useState<string | null>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    profileForm.setFieldsValue({ name: user?.name || '' });
  }, [profileForm, user?.name]);

  useEffect(() => {
    let active = true;

    if (!user?.id) {
      setAddresses([]);
      setAddressesLoading(false);
      return () => {
        active = false;
      };
    }

    setAddressesLoading(true);
    setAddressesError(null);
    addressesService
      .list()
      .then((data) => {
        if (!data.success || !data.data) {
          throw new Error(data.message || 'Unable to load saved addresses.');
        }
        if (active) setAddresses(data.data);
      })
      .catch((error: unknown) => {
        if (active) {
          setAddressesError(
            getErrorMessage(error, 'Unable to load saved addresses.')
          );
        }
      })
      .finally(() => {
        if (active) setAddressesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const primaryAddress =
    addresses.find((address) => address.isDefault) || addresses[0];

  const handleUpdateName = async (values: { name: string }) => {
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const data = await accountService.updateProfile({
        name: values.name.trim(),
      });
      if (!data?.success || !data?.user) {
        throw new Error(data?.message || 'Failed to update profile.');
      }

      dispatch(setCredentials({ user: data.user, sessionExpiresAt }));
      setEditingProfile(false);
      setProfileSuccess('Profile name updated successfully.');
      message.success('Profile updated.');
    } catch (error: unknown) {
      setProfileError(getErrorMessage(error, 'Error updating profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const data = await accountService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      if (!data?.success) {
        throw new Error(data?.message || 'Failed to change password.');
      }

      setPasswordSuccess('Password changed successfully.');
      passwordForm.resetFields();
      setEditingPassword(false);
      message.success('Password changed.');
      dispatch(logout());
      clearSessionHint();
      broadcastAuthTabEvent({ type: 'expired' });
      router.replace('/login?reason=session-expired');
    } catch (error: unknown) {
      setPasswordError(getErrorMessage(error, 'Error changing password.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const openNewAddressForm = () => {
    setEditingAddressId(null);
    setAddingAddress(true);
    addressForm.resetFields();
    addressForm.setFieldsValue({
      fullName: user?.name || '',
      addressType: 'Home',
      isDefault: addresses.length === 0,
    });
  };

  const openAddressEditor = (address: IAddress) => {
    setAddingAddress(false);
    setEditingAddressId(address._id);
    addressForm.setFieldsValue({
      fullName: address.fullName,
      mobile: address.mobile,
      pincode: address.pincode,
      locality: address.locality,
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      addressType: address.addressType,
      isDefault: address.isDefault,
    });
  };

  const closeAddressEditor = () => {
    setAddingAddress(false);
    setEditingAddressId(null);
    addressForm.resetFields();
  };

  const handleSaveAddress = async (values: AddressFormValues) => {
    setSavingAddress(true);
    setAddressesError(null);

    try {
      const payload = {
        ...values,
        fullName: values.fullName.trim(),
        mobile: values.mobile.trim(),
        pincode: values.pincode.trim(),
        locality: values.locality.trim(),
        addressLine: values.addressLine.trim(),
        city: values.city.trim(),
        state: values.state.trim(),
      };
      const response = editingAddressId
        ? await addressesService.update(editingAddressId, payload)
        : await addressesService.create(payload);
      const savedAddress = response.data;

      if (!response.success || !savedAddress) {
        throw new Error(response.message || 'Unable to save address.');
      }

      setAddresses((current) => {
        const next = payload.isDefault
          ? current.map((address) => ({ ...address, isDefault: false }))
          : current;
        if (editingAddressId) {
          return next.map((address) =>
            address._id === editingAddressId ? savedAddress : address
          );
        }
        return [savedAddress, ...next];
      });
      closeAddressEditor();
      message.success(editingAddressId ? 'Address updated.' : 'Address added.');
    } catch (error: unknown) {
      setAddressesError(getErrorMessage(error, 'Unable to save address.'));
    } finally {
      setSavingAddress(false);
    }
  };

  const renderAddressForm = () => (
    <Form
      form={addressForm}
      layout="vertical"
      onFinish={handleSaveAddress}
      requiredMark={false}
    >
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Form.Item
          name="fullName"
          label="Full Name"
          rules={[{ required: true, message: 'Enter the recipient name.' }]}
          className="!mb-3"
        >
          <Input maxLength={80} />
        </Form.Item>
        <Form.Item
          name="mobile"
          label="Mobile Number"
          rules={[{ required: true, message: 'Enter a mobile number.' }]}
          className="!mb-3"
        >
          <Input inputMode="tel" maxLength={15} />
        </Form.Item>
        <Form.Item
          name="addressLine"
          label="Address"
          rules={[{ required: true, message: 'Enter the address.' }]}
          className="!mb-3 sm:col-span-2"
        >
          <Input.TextArea rows={2} maxLength={240} />
        </Form.Item>
        <Form.Item
          name="locality"
          label="Locality"
          rules={[{ required: true, message: 'Enter the locality.' }]}
          className="!mb-3"
        >
          <Input maxLength={120} />
        </Form.Item>
        <Form.Item
          name="city"
          label="City/Town"
          rules={[{ required: true, message: 'Enter your city or town.' }]}
          className="!mb-3"
        >
          <Input maxLength={80} />
        </Form.Item>
        <Form.Item
          name="state"
          label="State"
          rules={[{ required: true, message: 'Enter your state.' }]}
          className="!mb-3"
        >
          <Input maxLength={80} />
        </Form.Item>
        <Form.Item
          name="pincode"
          label="PIN Code"
          rules={[{ required: true, message: 'Enter your PIN code.' }]}
          className="!mb-3"
        >
          <Input inputMode="numeric" maxLength={10} />
        </Form.Item>
        <Form.Item
          name="addressType"
          label="Type"
          rules={[{ required: true, message: 'Select an address type.' }]}
          className="!mb-3 sm:col-span-2"
        >
          <Radio.Group>
            <Radio value="Home">Home</Radio>
            <Radio value="Work">Work</Radio>
            <Radio value="Other">Other</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="isDefault"
          valuePropName="checked"
          className="!mb-3 sm:col-span-2"
        >
          <Checkbox>Set as default address</Checkbox>
        </Form.Item>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="primary"
          htmlType="submit"
          loading={savingAddress}
          className="font-medium"
        >
          Save Address
        </Button>
        <Button onClick={closeAddressEditor} disabled={savingAddress}>
          Cancel
        </Button>
      </div>
    </Form>
  );

  return (
    <div className="customer-page mx-auto w-full max-w-[880px] px-4 py-4 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-[12px] text-[#878787]">
        <Link href="/" className="text-inherit hover:text-[#a03037]">
          Home
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[#4d4d4d]">Profile</span>
      </nav>

      <div className="mx-auto max-w-[440px] md:mx-0 md:ml-8">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-[16px] font-semibold text-[#333333]">
              Personal Details
            </h1>
            <Button
              type="link"
              onClick={() => {
                setProfileError(null);
                setProfileSuccess(null);
                setEditingProfile((editing) => !editing);
              }}
              className="!h-auto !p-0 text-[12px] text-[#a03037]"
            >
              {editingProfile ? 'Cancel' : 'Edit'}
            </Button>
          </div>

          {profileSuccess && (
            <Alert message={profileSuccess} type="success" showIcon className="mb-3" />
          )}
          {profileError && (
            <Alert message={profileError} type="error" showIcon className="mb-3" />
          )}

          {editingProfile ? (
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleUpdateName}
              requiredMark={false}
            >
              <Form.Item
                name="name"
                label="Full Name"
                rules={[
                  { required: true, message: 'Please enter your name.' },
                  { min: 2, message: 'Name must be at least 2 characters.' },
                  { max: 60, message: 'Name must be 60 characters or fewer.' },
                ]}
                className="!mb-3"
              >
                <Input prefix={<UserOutlined />} maxLength={60} />
              </Form.Item>
              <div className="mb-3 flex justify-end gap-3">
                <Button onClick={() => setEditingProfile(false)}>Cancel</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={savingProfile}
                >
                  Save
                </Button>
              </div>
            </Form>
          ) : (
            <DisplayField label="Full Name" value={user?.name || ''} />
          )}

          <DisplayField label="Email Id" value={user?.email || ''} />
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[12px] text-[#4d4d4d]">Password</label>
              <Button
                type="link"
                onClick={() => {
                  setPasswordError(null);
                  setPasswordSuccess(null);
                  setEditingPassword((editing) => !editing);
                }}
                className="!h-auto !p-0 text-[12px] text-[#a03037]"
              >
                {editingPassword ? 'Cancel' : 'Change'}
              </Button>
            </div>
            <Input disabled value="************" className="!h-[40px] !bg-[#f5f5f5]" />
          </div>
          <DisplayField
            label="Mobile Number"
            value={primaryAddress?.mobile || ''}
          />

          {editingPassword && (
            <div className="mt-4 border-t border-[#e2e2e2] pt-4">
              {passwordSuccess && (
                <Alert
                  message={passwordSuccess}
                  type="success"
                  showIcon
                  className="mb-3"
                />
              )}
              {passwordError && (
                <Alert
                  message={passwordError}
                  type="error"
                  showIcon
                  className="mb-3"
                />
              )}
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handleChangePassword}
                requiredMark={false}
              >
                <Form.Item
                  name="currentPassword"
                  label="Current Password"
                  rules={[
                    { required: true, message: 'Enter your current password.' },
                  ]}
                  className="!mb-3"
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item
                  name="newPassword"
                  label="New Password"
                  rules={[
                    { required: true, message: 'Enter a new password.' },
                    { min: 8, max: 72, message: 'Password must be between 8 and 72 characters.' },
                    {
                      pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
                      message: 'Include at least one letter and one number.',
                    },
                  ]}
                  className="!mb-3"
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Confirm New Password"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: 'Confirm your new password.' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error('The two passwords do not match.')
                        );
                      },
                    }),
                  ]}
                  className="!mb-3"
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={savingPassword}
                >
                  Update Password
                </Button>
              </Form>
            </div>
          )}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[16px] font-semibold text-[#333333]">
              Address Details
            </h2>
            <Button
              onClick={openNewAddressForm}
              className="h-[30px] border-[#a03037] px-3 text-[11px] text-[#a03037]"
            >
              Add New Address
            </Button>
          </div>

          {addressesError && (
            <Alert
              message={addressesError}
              type="error"
              showIcon
              className="mb-4"
            />
          )}
          {addressesLoading ? (
            <p className="text-[13px] text-[#878787]">Loading addresses...</p>
          ) : addresses.length === 0 && !addingAddress ? (
            <p className="text-[13px] text-[#878787]">
              No saved addresses yet. Add an address to speed up checkout.
            </p>
          ) : (
            <div className="space-y-6">
              {addresses.map((address, index) => {
                const isEditing = editingAddressId === address._id;
                return (
                  <div key={address._id}>
                    <div className="mb-2 flex items-center gap-4">
                      <h3 className="text-[13px] font-semibold text-[#333333]">
                        {index + 1}. {address.addressType.toUpperCase()}
                      </h3>
                      {!isEditing && (
                        <Button
                          type="link"
                          onClick={() => openAddressEditor(address)}
                          className="!h-auto !p-0 text-[12px] text-[#a03037]"
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                    {isEditing ? (
                      renderAddressForm()
                    ) : (
                      <AddressDetails address={address} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {addingAddress && (
            <div className={addresses.length ? 'mt-5' : ''}>
              {addresses.length > 0 && (
                <h3 className="mb-2 text-[13px] font-semibold text-[#333333]">
                  New Address
                </h3>
              )}
              {renderAddressForm()}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
