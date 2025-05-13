"use client";

import Nav from "@/app/components/NavBar/Nav";
import Side from "@/app/components/sidebar/Sidebar";
import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav";
import { useEffect, useState } from "react";
import Image from "next/image";
import DashboardContent from "@/app/components/Dashboard/Dashboard";
import { useRouter } from "next/navigation";

// Helper function to decode JWT token
const decodeJWT = (token) => {
  try {
    // JWT token is split into three parts: header, payload, signature
    // We need the payload part (index 1)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export default function AdminLayout({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState({ email: '', role: '' });
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Extract user information from JWT token
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      const decodedToken = decodeJWT(token);
      if (decodedToken) {
        setUser({
          email: decodedToken.email || decodedToken.sub || '',
          role: decodedToken.role || 'user'
        });
        console.log('User data extracted from JWT:', {
          email: decodedToken.email || decodedToken.sub || 'No email found',
          role: decodedToken.role || 'user'
        });
      } else {
        console.error('Invalid token found in session storage');
        router.push('/login');
      }
    } else {
      console.error('No token found in session storage');
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window !== "undefined") {
      setMounted(true);
      
      // Set initial state
      setIsMobile(window.innerWidth < 640);

      // Add resize listener
      const handleResize = () => {
        setIsMobile(window.innerWidth < 640);
      };

      window.addEventListener("resize", handleResize);

      // Clean up
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Prevent hydration mismatch by not rendering until client-side
  if (!mounted) return null;

  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden">    
      {/* Only render the sidebar if not mobile */}
      {!isMobile && (
        <div className="fixed z-50 h-[749px] left-0 w-[140px] p-1">
          <Side 
            className="z-50" 
            email={user.email}
            role={user.role} 
          />
        </div>
      )}
      
      {/* Only render Nav on mobile */}
      {isMobile && (
        <div className="fixed z-50 w-full p-1 h-28">
          <Nav 
            className="z-50" 
            email={user.email}
            role={user.role} 
          />
        </div>
      )}
      
      {/* Main content area */}
      <div className={`w-full`}>
        {children}
      </div>
    </section>
  );
}