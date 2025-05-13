import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function CompleteTaskForm({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  workOrderId
}) {
  const [actions, setActions] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [notes, setNotes] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(workOrderId, { actions, partsUsed, notes });
  };

  // If not open or not mounted in the browser, don't render anything
  if (!isOpen || !isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-xl">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-800">Complete Task</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="actions" className="block text-sm font-medium text-gray-700 mb-1">
                Actions Taken
              </label>
              <textarea
                id="actions"
                value={actions}
                onChange={(e) => setActions(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              ></textarea>
            </div>

            <div>
              <label htmlFor="parts" className="block text-sm font-medium text-gray-700 mb-1">
                Parts Used
              </label>
              <textarea
                id="parts"
                value={partsUsed}
                onChange={(e) => setPartsUsed(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              ></textarea>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 rounded-md shadow-sm text-white hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}