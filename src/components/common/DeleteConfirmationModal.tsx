import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting = false,
}) => {
  const handleDelete = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error during deletion:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Delete
          </Button>
        </>
      }
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 text-red-500">
          <AlertTriangle size={24} />
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-300">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;