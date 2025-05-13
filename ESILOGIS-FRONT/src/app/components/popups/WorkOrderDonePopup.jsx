import React from "react";

const WorkOrderDonePopup = ({
  open,
  onClose,
  onSubmit,
  actions,
  setActions,
  partsUsed,
  setPartsUsed,
  notes,
  setNotes,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-12 w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-[#009FE3]">Work Order Done !</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="mb-4">
            <label className="block mb-1 font-medium">
              Actions<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={actions}
              onChange={e => setActions(e.target.value)}
              className="w-full border rounded-md p-2"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Parts Used</label>
            <input
              type="text"
              value={partsUsed}
              onChange={e => setPartsUsed(e.target.value)}
              className="w-full border rounded-md p-2"
            />
          </div>
          <div className="mb-6">
            <label className="block mb-1 font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border rounded-md p-2"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-1 rounded-full border border-gray-400 bg-white text-gray-700"
            >
              Not yet
            </button>
            <button
              type="submit"
              className="px-6 py-1 rounded-full bg-[#0060B4] text-white"
            >
              Done
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkOrderDonePopup;