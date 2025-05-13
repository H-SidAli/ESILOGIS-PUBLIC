"use client";
import React, { useRef, useEffect, useState } from "react";

const days = [
  "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday", "Sunday"
];

export default function SchedulePopup({ onClose, onAdd }) {
  const [day, setDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSubmit = () => {
    if (!day || !startTime || !endTime) return;
    onAdd({ day, startTime, endTime });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div
        ref={popupRef}
        className="bg-white rounded-[28px] py-10 px-8 sm:px-16 w-full max-w-[600px] mx-4 shadow-xl"
        style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)" }}
      >
        <h2 className="text-[28px] font-bold mb-6 font-oxanium">Add Schedule</h2>

        <div className="mb-5">
          <label className="block mb-2 text-base font-semibold font-oxanium">
            Day<span className="text-red-500">*</span>
          </label>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-full p-2.5 border border-[#C9C9C9] rounded-[10px] bg-white text-base font-oxanium focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ fontWeight: 500 }}
          >
            <option value="" disabled>Select a day</option>
            {days.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="mb-7">
          <label className="block mb-2 text-base font-semibold font-oxanium">
            Working Hours<span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-1/2 p-2.5 border border-[#C9C9C9] rounded-[10px] bg-white text-base font-oxanium focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="From"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-1/2 p-2.5 border border-[#C9C9C9] rounded-[10px] bg-white text-base font-oxanium focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="To"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-8 py-2 border border-[#C9C9C9] rounded-full text-lg font-oxanium font-medium bg-white hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!day || !startTime || !endTime}
            className={`px-8 py-2 rounded-full text-lg font-oxanium font-medium transition ${
              !day || !startTime || !endTime
                ? "bg-[#0060B4]/60 text-white cursor-not-allowed"
                : "bg-[#0060B4] text-white hover:bg-[#004d91]"
            }`}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}