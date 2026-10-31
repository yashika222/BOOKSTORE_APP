'use client';

import React, { useState } from 'react';
import {
  Tag,
  Button,
  Card,
  Collapse,
  Badge,
  Typography,
  message,
  Input,
  Spin,
} from 'antd';
import {
  DownloadOutlined,
  PlayCircleOutlined,
  ApiOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  LockOutlined,
} from '@ant-design/icons';
import api from '@/lib/axios';

const { Paragraph } = Typography;

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  authRequired: boolean;
  sampleBody?: any;
  defaultResponse: any;
}

const ENDPOINTS: Record<string, ApiEndpoint[]> = {
  Authentication: [
    {
      method: 'POST',
      path: '/api/auth/register',
      summary: 'Register new customer account',
      description: 'Creates user in MongoDB with bcrypt password hashing and returns an HTTP-only JWT cookie.',
      authRequired: false,
      sampleBody: {
        name: 'Alice Reader',
        email: 'alice@example.com',
        password: 'Password@123',
      },
      defaultResponse: {
        success: true,
        message: 'Account registered successfully',
        user: { id: '6523...', name: 'Alice Reader', email: 'alice@example.com', role: 'customer' },
      },
    },
    {
      method: 'POST',
      path: '/api/auth/login',
      summary: 'Login and establish JWT session',
      description: 'Validates credentials against MongoDB and sets a secure HTTP-only cookie.',
      authRequired: false,
      sampleBody: {
        email: 'admin@bookstore.com',
        password: 'Admin@123456',
      },
      defaultResponse: {
        success: true,
        message: 'Logged in successfully',
        user: { id: '6523...', name: 'Store Manager', email: 'admin@bookstore.com', role: 'admin' },
      },
    },
    {
      method: 'GET',
      path: '/api/auth/me',
      summary: 'Get current user session',
      description: 'Extracts session token from HTTP-only cookie or Authorization header.',
      authRequired: true,
      defaultResponse: {
        success: true,
        user: { id: '6523...', name: 'Store Manager', email: 'admin@bookstore.com', role: 'admin' },
      },
    },
    {
      method: 'POST',
      path: '/api/auth/logout',
      summary: 'Terminate user session',
      description: 'Clears the HTTP-only cookie by setting its maxAge to 0.',
      authRequired: false,
      defaultResponse: {
        success: true,
        message: 'Logged out successfully',
      },
    },
  ],
  'Commercial Books': [
    {
      method: 'GET',
      path: '/api/books',
      summary: 'Get commercial book inventory',
      description: 'Retrieves all commercial bookstore items from MongoDB with optional search and genre filters.',
      authRequired: false,
      defaultResponse: {
        success: true,
        count: 8,
        data: [{ isbn: '978-0-7352-1129-2', title: 'Atomic Habits', author: 'James Clear', price: 18.5, stock: 24, genre: 'Self-Help' }],
      },
    },
    {
      method: 'GET',
      path: '/api/books/978-0-7352-1129-2',
      summary: 'Get book by ISBN or ID (O(1) Hash Lookup)',
      description: 'Uses MongoDB indexed hash lookup on the isbn field to return book record in constant time.',
      authRequired: false,
      defaultResponse: {
        success: true,
        data: { isbn: '978-0-7352-1129-2', title: 'Atomic Habits', price: 18.5, stock: 24 },
      },
    },
    {
      method: 'POST',
      path: '/api/books',
      summary: 'Create commercial book record',
      description: 'Protected endpoint requiring admin authorization to insert a new title into the commercial store.',
      authRequired: true,
      sampleBody: {
        isbn: '978-0-13-235088-4',
        title: 'Clean Code',
        author: 'Robert C. Martin',
        price: 34.5,
        stock: 15,
        genre: 'Science',
        rating: 4.9,
      },
      defaultResponse: {
        success: true,
        message: 'Book created successfully in commercial catalog.',
      },
    },
  ],
  Orders: [
    {
      method: 'GET',
      path: '/api/orders',
      summary: 'Get placed orders',
      description: 'Fetches orders for the authenticated user, or all store orders if administrator.',
      authRequired: true,
      defaultResponse: {
        success: true,
        count: 1,
        data: [{ orderId: 'ORD-9X8K2-1029', total: 23.49, status: 'pending', items: [] }],
      },
    },
    {
      method: 'POST',
      path: '/api/orders',
      summary: 'Create order and enqueue in FIFO queue',
      description: 'Simulates checkout by saving order in MongoDB and placing order into the in-memory fulfillment Queue.',
      authRequired: false,
      sampleBody: {
        items: [{ bookId: 'comm-1', title: 'Atomic Habits', author: 'James Clear', price: 18.5, quantity: 1 }],
        shippingAddress: { fullName: 'John Doe', email: 'john@example.com', phone: '9876543210', addressLine: '123 Main St', city: 'Delhi', postalCode: '110001' },
        subtotal: 18.5,
        shippingFee: 4.99,
        total: 23.49,
      },
      defaultResponse: {
        success: true,
        message: 'Order created successfully and entered fulfillment queue.',
        orderId: 'ORD-ABC12-4012',
        queuePosition: 1,
      },
    },
  ],
};

export default function ApiDocsPage() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [testingPath, setTestingPath] = useState<string | null>(null);

  const handleTestEndpoint = async (endpoint: ApiEndpoint) => {
    const key = `${endpoint.method}:${endpoint.path}`;
    setTestingPath(key);

    try {
      let res;
      if (endpoint.method === 'GET') {
        res = await api.get(endpoint.path);
      } else if (endpoint.method === 'POST') {
        res = await api.post(endpoint.path, endpoint.sampleBody || {});
      } else if (endpoint.method === 'PATCH') {
        res = await api.patch(endpoint.path, endpoint.sampleBody || {});
      } else {
        res = await api.delete(endpoint.path);
      }

      setTestResults((prev) => ({
        ...prev,
        [key]: { status: res.status, data: res.data },
      }));
      message.success(`${endpoint.method} ${endpoint.path} succeeded (${res.status})`);
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [key]: { status: err.response?.status || 500, error: err.message },
      }));
      message.error(`${endpoint.method} ${endpoint.path} error: ${err.message}`);
    } finally {
      setTestingPath(null);
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return <Tag color="blue" className="font-mono font-bold">GET</Tag>;
      case 'POST':
        return <Tag color="green" className="font-mono font-bold">POST</Tag>;
      case 'PATCH':
        return <Tag color="orange" className="font-mono font-bold">PATCH</Tag>;
      case 'DELETE':
        return <Tag color="red" className="font-mono font-bold">DELETE</Tag>;
      default:
        return <Tag>{method}</Tag>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center text-lg">
                <ApiOutlined />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                REST API Documentation
              </h1>
              <Tag color="purple">OpenAPI 3.0</Tag>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Live Next.js Route Handlers with Winston logging, JWT authorization, and MongoDB persistence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a href="/openapi.json" download="bookstore-openapi.json">
              <Button icon={<DownloadOutlined />} className="text-xs font-semibold">
                OpenAPI Spec
              </Button>
            </a>
            <a href="/bookstore.postman_collection.json" download="bookstore.postman_collection.json">
              <Button type="primary" icon={<FileTextOutlined />} className="bg-violet-600 text-xs font-semibold">
                Postman Collection
              </Button>
            </a>
          </div>
        </div>

        <div className="bg-stone-50 rounded-xl p-3 text-xs text-gray-600 flex flex-wrap items-center gap-4 border border-gray-200/60">
          <div>Base URL: <b className="font-mono text-gray-800">/api</b></div>
          <div>Auth Mechanism: <b className="font-mono text-gray-800">HTTP-Only Cookie (bookstore_token)</b></div>
          <div>Logging: <b className="font-mono text-gray-800">Winston (Sanitized)</b></div>
        </div>
      </div>

      {/* Endpoints Groups */}
      <div className="space-y-6">
        {Object.entries(ENDPOINTS).map(([groupTitle, endpoints]) => (
          <div key={groupTitle} className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>{groupTitle}</span>
              <Badge count={endpoints.length} style={{ backgroundColor: '#7c3aed' }} />
            </h2>

            <div className="space-y-3">
              {endpoints.map((ep) => {
                const key = `${ep.method}:${ep.path}`;
                const testResult = testResults[key];
                const isTesting = testingPath === key;

                return (
                  <Card
                    key={key}
                    className="rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden"
                    bodyStyle={{ padding: 18 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getMethodBadge(ep.method)}
                        <span className="font-mono font-bold text-gray-900 text-sm">
                          {ep.path}
                        </span>
                        {ep.authRequired ? (
                          <Tag color="red" icon={<LockOutlined />} className="text-[10px]">
                            Protected (Auth Required)
                          </Tag>
                        ) : (
                          <Tag color="green" icon={<CheckCircleOutlined />} className="text-[10px]">
                            Public
                          </Tag>
                        )}
                      </div>

                      <Button
                        size="small"
                        icon={<PlayCircleOutlined />}
                        loading={isTesting}
                        onClick={() => handleTestEndpoint(ep)}
                        className="text-xs font-semibold bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 flex items-center gap-1 self-start sm:self-auto"
                      >
                        Try Request
                      </Button>
                    </div>

                    <p className="text-xs text-gray-600 mt-2 font-medium">
                      {ep.summary} — <span className="text-gray-400 font-normal">{ep.description}</span>
                    </p>

                    {/* Request Sample Body */}
                    {ep.sampleBody && (
                      <div className="mt-3 bg-stone-50 rounded-xl p-3 border border-gray-200 text-xs font-mono">
                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 font-sans">
                          Sample Request Body:
                        </div>
                        <Paragraph
                          copyable={{ text: JSON.stringify(ep.sampleBody, null, 2) }}
                          className="mb-0 text-gray-800"
                        >
                          <pre className="text-[11px]">{JSON.stringify(ep.sampleBody, null, 2)}</pre>
                        </Paragraph>
                      </div>
                    )}

                    {/* Live Test Result Output */}
                    {testResult && (
                      <div className="mt-3 bg-stone-900 text-emerald-400 rounded-xl p-3 text-xs font-mono">
                        <div className="flex items-center justify-between text-stone-400 text-[11px] mb-1 font-sans">
                          <span>Live Response (HTTP {testResult.status}):</span>
                        </div>
                        <pre className="text-[11px] overflow-x-auto text-emerald-300">
                          {JSON.stringify(testResult.data || testResult.error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
