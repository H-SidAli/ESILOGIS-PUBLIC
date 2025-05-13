"use client"; // Needed if using hooks

import { useEffect, useState } from "react";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user data from backend (adjust URL as needed)
    fetch("http://localhost:3000/auth/profile", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      {user ? (
        <>
          <h1 className="text-2xl font-bold">Welcome, {user.displayName}!</h1>
          {/* <img src={user.picture} alt="Profile" className="w-24 h-24 rounded-full mt-4" /> */}
          <a href="http://localhost:3000/auth/logout" className="mt-4 px-4 py-2 bg-red-500 text-white rounded">
            Logout
          </a>
        </>
      ) : (
        <h1 className="text-xl">You are not logged in</h1>
      )}
    </div>
  );
}
