import { Modal } from 'antd';

export function confirmDestructiveAction(options: {
  title: string;
  content: string;
  okText?: string;
  onOk: () => Promise<void> | void;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      title: options.title,
      content: options.content,
      okText: options.okText || 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        await options.onOk();
        resolve();
      },
      onCancel: () => reject(new Error('cancelled')),
    });
  });
}
