"use client";
import React, { useState } from "react";
import { X, Loader, ShieldAlert, ShieldCheck } from "lucide-react";
import Image from "next/image";
import account_circle from "../../../../public/Images/account_circle2.svg";

export default function UserDetailsPopup({ user, onClose, onBlockUser, onUnblockUser, refreshData }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Changed to use isBlocked field directly
  const isBlocked = user.isBlocked;

  const handleToggleBlockStatus = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      let success;
      if (isBlocked) {
        success = await onUnblockUser(user.id);
        if (success) setSuccess('User has been unblocked successfully');
      } else {
        success = await onBlockUser(user.id);
        if (success) setSuccess('User has been blocked successfully');
      }
      
      if (success && refreshData) {
        refreshData();
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating user status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/5 backdrop-blur-md flex items-center justify-center z-50 p-4 font-oxanium">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl">
        {/* Header with close button */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-[#1E1E1E]">User Details</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Status indicator */}
        <div className="px-8 pt-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
            isBlocked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {isBlocked ? (
              <>
                <ShieldAlert size={16} />
                <span className="font-medium">Blocked</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span className="font-medium">Active</span>
              </>
            )}
          </div>
        </div>

        {/* Success message */}
        {success && (
          <div className="mx-8 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mx-8 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Main content remains the same */}
        <div className="p-8 flex flex-col md:flex-row gap-6">
          {/* Left side - User details */}
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center gap-2">
              <p className="text-lg font-semibold">First Name</p>
              <p className="text-lg">{user.firstName}</p>
            </div>
            
            <div className="flex justify-between items-center gap-2">
              <p className="text-lg font-semibold">Last Name</p>
              <p className="text-lg">{user.lastName}</p>
            </div>
            
            <div className="flex justify-between items-center gap-2">
              <p className="text-lg font-semibold">Email</p>
              <p className="text-lg underline">{user.email}</p>
            </div>

            <div className="flex justify-between items-center gap-2">
              <p className="text-lg font-semibold">Role</p>
              <p className="text-lg capitalize">{user.role || 'User'}</p>
            </div>

            <div className="flex justify-between items-center gap-2">
              <p className="text-lg font-semibold">Created At</p>
              <p className="text-lg">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Right side - Profile image */}
          <div className="flex items-center justify-center md:justify-end">
            <div className="rounded-full bg-gray-100 flex items-center justify-center">
              <Image 
                src={account_circle} 
                alt="User profile" 
                width={100} 
                height={100}
              />
            </div>
          </div>
        </div>

        {/* Footer with actions */}
        <div className="p-6 flex justify-between border-t">
          <button
            onClick={onClose}
            className="px-6 py-1.5 border border-gray-400 rounded-lg text-base hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Close
          </button>

          <button
            onClick={handleToggleBlockStatus}
            disabled={loading}
            className={`px-6 py-1.5 rounded-lg text-white flex items-center gap-2 ${
              isBlocked 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : isBlocked ? (
              <>
                <ShieldCheck size={16} />
                <span>Unblock User</span>
              </>
            ) : (
              <>
                <ShieldAlert size={16} />
                <span>Block User</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}