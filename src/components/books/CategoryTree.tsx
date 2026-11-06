'use client';

import React from 'react';
import { Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { FolderOutlined, ReadOutlined } from '@ant-design/icons';
import { BOOKSTORE_CATEGORY_TREE } from '@/lib/dsa';

interface CategoryTreeProps {
  selectedCategory?: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryTree({
  selectedCategory,
  onSelectCategory,
}: CategoryTreeProps) {
  const treeData: DataNode[] = [
    {
      title: <span className="font-semibold text-gray-800">All categories</span>,
      key: 'all',
      icon: <ReadOutlined />,
    },
    ...BOOKSTORE_CATEGORY_TREE.map((node) => ({
      title: <span className="font-medium text-gray-700">{node.title}</span>,
      key: node.key,
      icon: <FolderOutlined className="text-violet-500" />,
      children: node.children?.map((child) => ({
        title: <span className="text-xs text-gray-600">{child.title}</span>,
        key: child.key,
        icon: <ReadOutlined className="text-gray-400" />,
      })),
    })),
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="mb-2 border-b border-gray-100 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Browse by genre
        </span>
      </div>

      <Tree
        showIcon
        defaultExpandAll
        selectedKeys={selectedCategory ? [selectedCategory] : ['all']}
        onSelect={(selectedKeys) => {
          if (selectedKeys.length > 0) {
            onSelectCategory(String(selectedKeys[0]));
          }
        }}
        treeData={treeData}
        className="bg-transparent text-sm"
      />
    </div>
  );
}
