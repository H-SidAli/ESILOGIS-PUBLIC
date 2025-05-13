import arrows from "../../../../public/Images/arrows.svg";
import Image from "next/image";

export default function Nav({email, role, onLogout}) {
  // Enhanced logout handler to properly kill the session token
  const handleLogoutClick = (e) => {
    e.preventDefault();
    
    // Clear token from sessionStorage directly to ensure it's removed
    // This provides a fallback if the parent's onLogout fails
    sessionStorage.removeItem("token");
    
    // Clear any other auth-related data that might be stored
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("userData");
    localStorage.removeItem("authState");
    
    // Call the parent component's onLogout handler if provided
    if (typeof onLogout === 'function') {
      onLogout();
    } else {
      // Fallback redirect if no onLogout handler is provided
      window.location.href = '/login';
    }
  };
  
  return (
    <div className="flex justify-between items-center pl-8 py-4 bg-gray-100 border-b border-gray-300">
      {/* Left: ESILOGIS Logo */}
      <div className="flex items-center">
        <Image
          src="/Images/esilogisLogo.svg"
          width={90}
          height={90}
          alt="ESILOGIS Logo"
        />
      </div>
      
      {/* Right: User Info + Arrows */}
      <div className="flex items-center">
        {/* User Info + Avatar */}
        <div className="flex items-center gap-4 z-10">
          <div className="text-right">
            <p className="font-semibold text-sm truncate max-w-[120px]">{email}</p>
            <button 
              className="mt-1 px-4 py-1 border border-gray-300 rounded-full text-xs hover:bg-gray-200 transition"
              onClick={handleLogoutClick}
            >
              Log Out
            </button>
          </div>
          <Image 
            src="/Images/account_circle2.svg" 
            width={48} 
            height={48}
            alt="Profile" 
            className="rounded-full"
          />
        </div>
        
        {/* Arrows Image - positioned to the right */}
        <div className="hidden sm:block -mt-4">
          <Image 
            src={arrows} 
            alt="" 
            width={212}
          />
        </div>
      </div>
    </div>
  );
}