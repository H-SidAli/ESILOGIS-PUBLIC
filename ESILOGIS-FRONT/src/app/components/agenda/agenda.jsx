import React, { useState } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";


const DatePickerButton = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Button to open Date Picker */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center p-2 rounded-[7px] bg-gray-200 text-black h-[31px] cursor-pointer"
      >
        Date 
      </button>

      {/* Hidden Date Picker (opens on button click) */}
      {open && (
        <div className="absolute mt-2 z-10 bg-white shadow-lg rounded-md">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              setOpen(false); // Close on select
            }}
            inline
          />
        </div>
      )}
    </div>
  );
};

export default DatePickerButton;
