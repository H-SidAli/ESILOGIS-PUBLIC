"use client";
import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import UsersTable from "@/app/components/users-table/userstable";
import arrows from "../../../../../public/Images/arrows.svg";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import UserDetailsPopup from "@/app/components/popups/UserDetailsPopup";
import { Loader, AlertCircle } from "lucide-react";

export default function Users() {
  const [isMobile, setIsMobile] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // API related states
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handler for showing user details
  const handleShowUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleCloseUserDetails = () => {
    setShowUserDetails(false);
    setSelectedUser(null);
  };

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/userAccounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched users:', data);
      
      // Handle different response formats
      const userData = Array.isArray(data) ? data : 
                       (data && Array.isArray(data.data)) ? data.data : [];
      
      setUsers(userData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and refresh mechanism
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshTrigger]);

  // Mobile detection
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 640);

      const handleResize = () => {
        setIsMobile(window.innerWidth < 640);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Block user function (uses DELETE endpoint)
  const handleBlockUser = async (userId) => {
    if (!userId) {
      console.error('Cannot block user: userId is undefined');
      return false;
    }
    
    if (!confirm("Are you sure you want to block this user?")) {
      return false;
    }
    
    try {
      console.log("Blocking user with ID:", userId);
      const response = await fetch(`http://localhost:3001/api/userAccounts/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      // Update the user isBlocked field in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, isBlocked: true } : user
        )
      );
      
      // If we're viewing the blocked user's details, update them
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => ({ ...prev, isBlocked: true }));
      }
      
      return true;
    } catch (err) {
      console.error('Error blocking user:', err);
      alert(`Failed to block user: ${err.message}`);
      return false;
    }
  };

  // Unblock user function (uses PUT endpoint)
  const handleUnblockUser = async (userId) => {
    if (!userId) {
      console.error('Cannot unblock user: userId is undefined');
      return false;
    }
    
    if (!confirm("Are you sure you want to unblock this user?")) {
      return false;
    }
    
    try {
      console.log("Unblocking user with ID:", userId);
      const response = await fetch(`http://localhost:3001/api/userAccounts/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      // Update the user isBlocked field in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, isBlocked: false } : user
        )
      );
      
      // If we're viewing the unblocked user's details, update them
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => ({ ...prev, isBlocked: false }));
      }
      
      return true;
    } catch (err) {
      console.error('Error unblocking user:', err);
      alert(`Failed to unblock user: ${err.message}`);
      return false;
    }
  };

  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden">
      <div className="hidden sm:block absolute top-0 right-0 z-10">
        <Image src={arrows} alt="" width={212} />
      </div>

      <div className={`w-full z-30 ${isMobile ? "mt-10" : "ml-[129px]"}`}>
        <div className="">
          <h1 className="font-oxanium p-6 font-semibold text-[26.07px]">
            Users
          </h1>
        </div>

        <div className="">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="h-8 w-8 text-[#0060B4] animate-spin" />
            </div>
          ) : error ? (
            <div className="mx-4 sm:mx-8 my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5" />
                <p className="font-bold">Error loading users</p>
              </div>
              <p>{error}</p>
            </div>
          ) : (
            <UsersTable 
              users={users}
              onViewDetails={handleShowUserDetails}
              onBlockUser={handleBlockUser}
              onUnblockUser={handleUnblockUser}
            />
          )}
        </div>
      </div>

      {showUserDetails && (
        <UserDetailsPopup
          user={selectedUser}
          onClose={handleCloseUserDetails}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
          refreshData={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}
    </section>
  );
}