"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/app/components/Navbar2/Nav';
import WelcomeSection from '@/app/components/WelcomeSection/WelcomeSection';
import ReportHistoryTable from '@/app/components/report-history-table/ReportHistoryTable';
import Footer from '@/app/components/footer/Footer';

export default function Home() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState({ 
    type: 'Leave Feedback', 
    content: '' 
  });
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Handle responsive design
      setIsMobile(window.innerWidth < 640);
      const handleResize = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener("resize", handleResize);
      
      // Get email from JWT token
      try {
        const token = sessionStorage.getItem("token");
        if (token) {
          // Decode the JWT token payload (second part)
          const payload = token.split(".")[1];
          // Base64 decode and parse as JSON
          const decodedPayload = JSON.parse(atob(payload));
          // Extract email from payload
          setEmail(decodedPayload.email || decodedPayload.sub || "");
        } else {
          // No token found, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error("Error decoding JWT token:", error);
      }
      
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [router]);

  // Logout handler function
  const handleLogout = () => {
    // Clear the token from sessionStorage
    sessionStorage.removeItem("token");
    
    // Clear any other user-related data in sessionStorage if needed
    // sessionStorage.removeItem("userData");
    
    // Redirect to login page
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5] text-gray-800 relative overflow-hidden">
      <Nav 
        email={email} 
        role='user' 
        onLogout={handleLogout} 
      />
   
      <main className={`flex-grow px-4 md:px-8 lg:px-0 max-w-[1200px] w-full mx-auto ${isMobile ? 'mt-20' : 'mt-1'} space-y-8`}>
        <WelcomeSection isMobile={isMobile} />
        <h1 className='mb-1 font-medium'>Your Reports History</h1>
        <div className="bg-white rounded-xl shadow-md mb-10 overflow-x-auto">
          <div className='max-h-[400px]'>
          <ReportHistoryTable 
            isMobile={isMobile}
            onFeedbackClick={(feedbackType) => {
              setSelectedFeedback({
                type: feedbackType,
                content: feedbackType === 'Your Feedback' ? 'Sample feedback content' : ''
              });
              setShowPopup(true);
            }}
          />
          </div>
        </div>
      </main>

      <Footer isMobile={isMobile} />
      
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-[20px] p-6 w-full max-w-[450px] mx-4 shadow-xl border-2 border-gray-200">
            <h2 className="text-xl font-semibold text-[#1E1E1E] mb-4">
              {selectedFeedback.type === 'Your Feedback' ? 'Your Feedback' : 'Add Feedback'}
            </h2>
            
            <textarea
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0060B4] text-sm mb-4"
              rows={5}
              value={selectedFeedback.content}
              onChange={(e) => setSelectedFeedback({
                ...selectedFeedback, 
                content: e.target.value
              })}
              disabled={selectedFeedback.type === 'Your Feedback'}
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 border border-[#E5E7EB] rounded-[10px] hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              {selectedFeedback.type !== 'Your Feedback' && (
                <button 
                  onClick={() => {
                    console.log('Submitted:', selectedFeedback.content);
                    setShowPopup(false);
                  }}
                  className="px-4 py-2 bg-[#0060B4] text-white rounded-[10px] hover:bg-[#0056A4] text-sm font-medium"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}