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
  // Convert our category tree structure to Ant Design DataNode[] format
  const treeData: DataNode[] = [
    {
      title: <span className="font-semibold text-gray-800">All Categories</span>,
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
    <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Category Hierarchy
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-mono font-semibold">
          Tree (DSA)
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
        className="text-sm bg-transparent"
      />
    </div>
  );
}
