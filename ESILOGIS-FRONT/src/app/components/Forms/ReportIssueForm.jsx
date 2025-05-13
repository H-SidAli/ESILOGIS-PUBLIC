"use client"
import { useState } from 'react';
import Link from 'next/link';

export default function ReportIssueForm({ onScanClick }) {
  const [formData, setFormData] = useState({
    location: '',
    description: '',
    equipment: '',
    assignTo: '',
    priority: 'low'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full px-48 ">
      <h2 className="text-2xl font-semibold mb-6">Report an Issue or Assign Preventive Intervention (PI)</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Location <span className="text-red-500">*</span>
          </label>
          <select 
            className="w-full border rounded-lg p-1"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
          >
            <option value="">Select location</option>
            <option value="building1">Building 1</option>
            <option value="building2">Building 2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea 
            className="w-full border rounded-lg p-3 h-24" 
            placeholder="Describe the issue..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Assign Equipment (Optional)
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="w-full border rounded-lg p-2"
              value={formData.equipment}
              onChange={(e) => setFormData({...formData, equipment: e.target.value})}
            />
            <button 
              type="button"
              className="bg-orange-500 text-white rounded-lg px-6 whitespace-nowrap hover:bg-orange-600"
              onClick={onScanClick}
            >
              Scan Barcode
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Assign To
          </label>
          <select 
            className="w-full border rounded-lg p-1"
            value={formData.assignTo}
            onChange={(e) => setFormData({...formData, assignTo: e.target.value})}
          >
            <option value="">Select Assignment</option>
            <option value="team1">Maintenance Team</option>
            <option value="team2">IT Support</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <div className="flex gap-2">
            {['low', 'medium', 'high'].map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => setFormData({...formData, priority})}
                className={`px-4 py-2 rounded-full capitalize ${
                  formData.priority === priority
                    ? priority === 'low' 
                      ? 'bg-blue-200 text-blue-600'
                      : priority === 'medium'
                      ? 'bg-yellow-200 text-yellow-600'
                      : 'bg-red-200 text-red-600'
                    : 'bg-gray-100 text-gray-600'
                } text-sm`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Date of intervention
          </label>
          <select 
            className="w-full border rounded-lg p-1"
            value={formData.assignTo}
            onChange={(e) => setFormData({...formData, assignTo: e.target.value})}
          >
            <option value="">Select Date</option>
            <option value="team1">date 1</option>
            <option value="team2">date 2</option>
          </select>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button 
            type="button" 
            className="border px-8 py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700"
          >
            Report Issue
          </button>
        </div>
      </form>
    </div>
  );
}