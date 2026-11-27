'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Alert,
  Tag,
  Popconfirm,
  Tabs,
  Card,
  Spin,
  message,
  Switch,
  Statistic,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
  EditOutlined,
  DeleteOutlined,
  ShoppingOutlined,
  DashboardOutlined,
  BookOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  LineChartOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '@/store/hooks';
import { ICommercialBook, IOrder } from '@/types';
import { booksService, ordersService } from '@/lib/api';
import BookCoverImage from '@/components/books/BookCoverImage';
import { formatCurrency } from '@/lib/currency';
import { confirmDestructiveAction } from '@/lib/confirmAction';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAppSelector(
    (state) => state.auth
  );

  const [activeTab, setActiveTab] = useState<'books' | 'orders'>('books');
  const [books, setBooks] = useState<ICommercialBook[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBook, setEditingBook] = useState<ICommercialBook | null>(null);
  const [modalForm] = Form.useForm();
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Fetch Commercial Books
  const fetchBooks = useCallback(async () => {
    try {
      const res = await booksService.list({ page: 1, pageSize: 1000 });
      if (res?.success && Array.isArray(res?.data)) {
        setBooks(res.data);
        setBooksError(null);
      } else {
        throw new Error(res?.message || 'Failed to load books.');
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Failed to load books.';
      setBooksError(error);
      message.error(error);
    }
  }, []);

  // Fetch Store Orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await ordersService.list();
      if (res?.success && Array.isArray(res?.data)) {
        setOrders(res.data);
        setOrdersError(null);
      } else {
        throw new Error(res?.message || 'Failed to load orders.');
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Failed to load orders.';
      setOrdersError(error);
      message.error(error);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && user?.role === 'admin') {
        Promise.all([fetchBooks(), fetchOrders()]).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, user, authLoading, fetchBooks, fetchOrders]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingBook(null);
    modalForm.resetFields();
    modalForm.setFieldsValue({
      price: 15.99,
      stock: 10,
      rating: 4.5,
      genre: 'Fiction',
      featured: false,
    });
    setModalVisible(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (book: ICommercialBook) => {
    setEditingBook(book);
    modalForm.setFieldsValue({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      description: book.description,
      price: book.price,
      stock: book.stock,
      genre: book.genre,
      rating: book.rating,
      coverImage: book.coverImage,
      featured: book.featured,
    });
    setModalVisible(true);
  };

  // Submit Modal (Add or Edit)
  const handleModalSubmit = async () => {
    try {
      const values = await modalForm.validateFields();
      setModalSubmitting(true);

      if (editingBook) {
        // PATCH existing book
        const bookKey = editingBook._id || editingBook.id || editingBook.isbn;
        const res = await booksService.update(bookKey, values);
        if (res?.success) {
          message.success('Book updated successfully');
          setModalVisible(false);
          fetchBooks();
        }
      } else {
        // POST create book
        const res = await booksService.create(values);
        if (res?.success) {
          message.success('Book created successfully in commercial catalog');
          setModalVisible(false);
          fetchBooks();
        }
      }
    } catch (err: any) {
      message.error(err.message || 'Operation failed');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete Book
  const handleDeleteBook = async (book: ICommercialBook) => {
    try {
      const bookKey = book._id || book.id || book.isbn;
      const res = await booksService.remove(bookKey);
      if (res?.success) {
        message.success(`Deleted "${book.title}"`);
        fetchBooks();
      }
    } catch (err: any) {
      message.error(err.message || 'Failed to delete book');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Spin size="large" tip="Verifying administrator credentials..." />
      </div>
    );
  }

  // Restrict access if not logged in or not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 border border-gray-200/80 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl mx-auto">
            <LockOutlined />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Admin Authorization Required
          </h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            This dashboard is restricted to authorized bookstore administrators. Please sign in with an admin account.
          </p>

          <div className="pt-2">
            <Link href="/login">
              <Button type="primary" size="large" className="bg-violet-600 font-semibold">
                Go to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Summary Metrics calculations
  const totalStockUnits = books.reduce((acc, b) => acc + (b.stock || 0), 0);
  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);

  // Book Table Columns
  const bookColumns: ColumnsType<ICommercialBook> = [
    {
      title: 'Cover & Title',
      dataIndex: 'title',
      key: 'title',
      render: (_, book) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-14 bg-stone-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200">
            <BookCoverImage
              src={book.coverImage}
              title={book.title}
              author={book.author}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="font-bold text-sm text-gray-900">{book.title}</div>
            <div className="text-xs text-gray-500">By {book.author}</div>
            <div className="text-[10px] font-mono text-purple-700">ISBN: {book.isbn}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Genre',
      dataIndex: 'genre',
      key: 'genre',
      render: (genre: string) => <Tag color="blue">{genre}</Tag>,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => <span className="font-bold">{formatCurrency(price)}</span>,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => (
        <Tag color={stock > 5 ? 'green' : stock > 0 ? 'orange' : 'red'}>
          {stock} in stock
        </Tag>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => <span>★ {rating || 4.5}</span>,
    },
    {
      title: 'Featured',
      dataIndex: 'featured',
      key: 'featured',
      render: (featured: boolean) => (
        <Tag color={featured ? 'gold' : 'default'}>{featured ? 'Featured' : 'Standard'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, book) => (
        <div className="flex items-center gap-2">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEditModal(book)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Book"
            description={`Remove "${book.title}" from catalog?`}
            onConfirm={() => handleDeleteBook(book)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  // Order Table Columns
  const orderColumns: ColumnsType<IOrder> = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (id: string) => <span className="font-mono font-bold text-gray-800">{id}</span>,
    },
    {
      title: 'Customer Email',
      dataIndex: 'userEmail',
      key: 'userEmail',
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => (
        <span className="text-xs">
          {items.map((i) => `${i.title} (x${i.quantity})`).join(', ')}
        </span>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => (
        <span className="font-bold text-violet-700">{formatCurrency(total)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color =
          status === 'delivered' ? 'green' : status === 'shipped' ? 'blue' : 'purple';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString() : 'Recent',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Admin Management Dashboard
            </h1>
            <Tag color="purple" className="font-bold">
              ADMIN MODE
            </Tag>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage commercial book inventory and review customer orders.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleOpenAddModal}
          className="bg-violet-600 hover:bg-violet-700 font-semibold"
        >
          Add Commercial Book
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-gray-200/80 shadow-sm">
          <Statistic
            title="Commercial Titles"
            value={booksError ? '—' : books.length}
            prefix={<BookOutlined className="text-violet-600 mr-1" />}
          />
        </Card>
        <Card className="rounded-2xl border border-gray-200/80 shadow-sm">
          <Statistic
            title="Total Stock Units"
            value={booksError ? '—' : totalStockUnits}
            prefix={<ShoppingOutlined className="text-amber-500 mr-1" />}
          />
        </Card>
        <Card className="rounded-2xl border border-gray-200/80 shadow-sm">
          <Statistic
            title="Orders Placed"
            value={ordersError ? '—' : orders.length}
            prefix={<CheckCircleOutlined className="text-emerald-500 mr-1" />}
          />
        </Card>
        <Card className="rounded-2xl border border-gray-200/80 shadow-sm">
          <Statistic
            title="Order Total"
            value={ordersError ? '—' : totalRevenue}
            precision={2}
            prefix={<DollarOutlined className="text-violet-600 mr-1" />}
          />
        </Card>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 sm:p-6 space-y-4">
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as 'books' | 'orders')}
          items={[
            {
              key: 'books',
              label: (
                <span className="font-bold flex items-center gap-1.5">
                  <BookOutlined /> Commercial Books Catalog ({books.length})
                </span>
              ),
            },
            {
              key: 'orders',
              label: (
                <span className="font-bold flex items-center gap-1.5">
                  <LineChartOutlined /> Customer Orders ({orders.length})
                </span>
              ),
            },
          ]}
        />

        {activeTab === 'books' ? (
          booksError ? (
          <Alert
            type="error"
            showIcon
            message="Commercial inventory unavailable"
            description={booksError}
            action={<Button size="small" onClick={() => void fetchBooks()}>Retry</Button>}
          />
          ) : (
          <Table
            columns={bookColumns}
            dataSource={books}
            rowKey={(b) => b._id || b.isbn || b.id || ''}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 800 }}
          />
          )
        ) : (
          ordersError ? (
          <Alert
            type="error"
            showIcon
            message="Customer orders unavailable"
            description={ordersError}
            action={<Button size="small" onClick={() => void fetchOrders()}>Retry</Button>}
          />
          ) : (
          <Table
            columns={orderColumns}
            dataSource={orders}
            rowKey={(o) => o.orderId || o._id || ''}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 800 }}
          />
          )
        )}
      </div>

      {/* Add / Edit Book Modal */}
      <Modal
        title={editingBook ? 'Edit Commercial Book' : 'Add New Commercial Book'}
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={modalSubmitting}
        okText={editingBook ? 'Save Changes' : 'Create Book'}
        okButtonProps={{ className: 'bg-violet-600' }}
        width={600}
      >
        <Form form={modalForm} layout="vertical" className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="isbn"
              label="ISBN"
              rules={[{ required: true, message: 'ISBN is required' }]}
            >
              <Input placeholder="978-0-1234-5678-9" disabled={!!editingBook} />
            </Form.Item>

            <Form.Item
              name="genre"
              label="Genre"
              rules={[{ required: true, message: 'Genre is required' }]}
            >
              <Select
                options={[
                  { value: 'Fiction', label: 'Fiction' },
                  { value: 'Science Fiction', label: 'Science Fiction' },
                  { value: 'Self-Help', label: 'Self-Help' },
                  { value: 'Mystery', label: 'Mystery' },
                  { value: 'Science', label: 'Science' },
                  { value: 'History', label: 'History' },
                  { value: 'Biography', label: 'Biography' },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="title"
            label="Book Title"
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input placeholder="e.g. Atomic Habits" />
          </Form.Item>

          <Form.Item
            name="author"
            label="Author"
            rules={[{ required: true, message: 'Author is required' }]}
          >
            <Input placeholder="e.g. James Clear" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Book summary or synopsis..." />
          </Form.Item>

          <div className="grid grid-cols-3 gap-3">
            <Form.Item
              name="price"
              label="Price ($)"
              rules={[{ required: true, message: 'Price is required' }]}
            >
              <InputNumber min={0.5} step={0.5} className="w-full" />
            </Form.Item>

            <Form.Item
              name="stock"
              label="Stock Units"
              rules={[{ required: true, message: 'Stock is required' }]}
            >
              <InputNumber min={0} step={1} className="w-full" />
            </Form.Item>

            <Form.Item name="rating" label="Rating (0 - 5)">
              <InputNumber min={0} max={5} step={0.1} className="w-full" />
            </Form.Item>
          </div>

          <Form.Item name="coverImage" label="Cover Image URL">
            <Input placeholder="https://images.unsplash.com/photo-..." />
          </Form.Item>

          <Form.Item name="featured" label="Featured on Home Page" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
