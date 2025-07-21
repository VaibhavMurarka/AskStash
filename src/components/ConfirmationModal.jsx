import React from 'react';

/**
 * A reusable confirmation modal component.
 *
 * @param {object} props - The component's props.
 * @param {boolean} props.isOpen - Whether the modal is open or not.
 * @param {() => void} props.onClose - Function to call when the modal is closed (e.g., by clicking Cancel).
 * @param {() => void} props.onConfirm - Function to call when the action is confirmed (e.g., by clicking Delete).
 * @param {string} props.title - The title of the modal.
 * @param {string} props.message - The message/description shown in the modal body.
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  // If the modal is not open, don't render anything.
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Modal panel */}
      <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 text-left shadow-xl transition-all sm:my-8">
        <div className="flex items-start">
          {/* Icon */}
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          {/* Modal Content */}
          <div className="ml-4 mt-0 flex-grow text-left">
            <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose(); // Close modal after confirmation
            }}
            className="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;