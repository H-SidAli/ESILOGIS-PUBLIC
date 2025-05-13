"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import googleLogo from "../../../../public/Images/googleLogo.svg";
import backarrow1 from "../../../../public/Images/backarrow1.svg";
import backarrow2 from "../../../../public/Images/backarrow2.svg";
import backarrow3 from "../../../../public/Images/backarrow3.svg";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [imageSrc, setImageSrc] = useState(backarrow1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  
  // Check for token on page load (for Google OAuth redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const role = urlParams.get("role");
    
    // If token exists in URL, handle the OAuth login redirect
    if (token) {
      handleOAuthRedirect(token, role);
    }
  }, []);
  
  // Handle OAuth redirect with token
  const handleOAuthRedirect = async (token, role) => {
    try {
      sessionStorage.setItem("token", token);
      
      // Show success message
      setSuccessMessage("Login successful! ...");
      
      // Redirect based on role
      setTimeout(() => {
        if (role === 'ADMIN') {
          router.push("/admin/dashboard");
        } else if (role === 'TECHNICIAN') {
          router.push("/technician/workOrders");
        } else if (role === 'USER') {
          router.push("/user/home");
        } else {
          console.error("Unknown role:", role);
          setError("Unknown role. Please contact support.");
        }
      }, 500);
    } catch (error) {
      console.error("OAuth redirect error:", error);
      setError("Failed to process OAuth login. Please try again.");
    }
  };

  // Regular login handler
  const handleFormActionLogin = async (formData) => {
    const formDataObj = Object.fromEntries(formData.entries());
    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formDataObj),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Login failed. Please check your credentials.");
      }
      
      if (data.success) {
        // Save authentication data
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("roleId", data.roleId);
        
        // Show success message
        setSuccessMessage("Login successful! Redirecting...");
        
        // Redirect after short delay
        setTimeout(() => {
          if (data.role === 'ADMIN') {
            router.push("/admin/dashboard");
          } else if (data.role === 'TECHNICIAN') {
            router.push("/technician/workOrders");
          } else if (data.role === 'USER') {
            router.push("/user/home");
          } else {
            console.error("Unknown role:", data.role);
            setError("Unknown role. Please contact support.");
          }
        }, 1500);
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google OAuth login
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3001/auth/google";
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    
    if (!password) {
      setError("Password is required");
      return;
    }
    
    try {
      await handleFormActionLogin(new FormData(e.target));
    } catch (error) {
      console.error("Form submission error:", error);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  // If we have a success message, show success UI
  if (successMessage) {
    return (
      <section className="w-full h-screen flex flex-col items-center justify-center bg-[#EDEDED] relative">
        <div className="flex flex-col items-center justify-center gap-6 w-[300px] md:w-[434px]">
          <div className="flex justify-center w-full mb-4">
            <Image
              src="/Images/esilogisLogo.svg"
              alt="Esilogis Logo"
              width={100}
              height={100}
              className="w-[100px] md:w-[150px]"
            />
          </div>
          
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg text-center w-full">
            <p className="font-bold text-lg mb-1">✓ {successMessage}</p>
            <div className="w-full bg-green-200 h-1 mt-4 overflow-hidden rounded">
              <div className="bg-green-500 h-1 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full h-screen flex flex-col items-center justify-center bg-[#EDEDED] relative">
      {/* Back Button */}
      <div
        className="absolute top-7 left-7 h-[23px]"
        onMouseEnter={() => setImageSrc(backarrow2)}
        onMouseLeave={() => setImageSrc(backarrow1)}
        onClick={() => {
          router.back(), setImageSrc(backarrow3);
        }}
      >
        <Link
          href="/"
          className="ml-4 flex flex-row items-center text-text-dark font-outfit hover:text-text-gray"
        >
          <Image
            src={imageSrc}
            alt="Back Arrow"
            className="cursor-pointer"
            width={20}
          />
          <p className="ml-4">Go back to the Log In page</p>
        </Link>
      </div>

      {/* Login Container */}
      <div className="flex flex-col items-center justify-center gap-10 w-[300px] h-[550px] md:w-[434px] md:h-[400px]">
        {/* Logo */}
        <div className="flex flex-row justify-center items-center w-[500px] h-[120px]">
          <Image
            src="/Images/esilogisLogo.svg"
            alt="Esilogis Logo"
            width={100}
            height={100}
            className="w-[100px] md:w-[150px]"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-2 text-sm">
            <div className="flex items-start">
              <div className="py-1">
                <svg className="fill-current h-4 w-4 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
                </svg>
              </div>
              <div>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-center rounded-lg w-full mx-auto h-full"
        >
          {/* Email Input */}
          <div className="flex flex-col items-start w-full py-2">
            <label htmlFor="email" className="py-1 font-outfit font-light">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-2 p-2 rounded-[16px] w-[300px] h-[48px] md:w-[434px] md:h-[53px] outline-none shadow-custom bg-[#EDEDED] autofill:bg-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col items-start w-full py-2">
            <label htmlFor="password" className="py-1 font-outfit font-light">
              Password
            </label>
            <div className="relative w-full">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-2 p-2 pr-10 rounded-[16px] w-[300px] h-[48px] md:w-[434px] md:h-[53px] outline-none shadow-custom bg-[#EDEDED] autofill:bg-transparent"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-start w-full font-outfit">
            <Link
              href="../forgot-password"
              className="font-light text-sm text-[#0060B4] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Buttons */}
          <div className="flex flex-col items-center justify-center w-full gap-6 mt-7">
            <button
              type="submit"
              disabled={isSubmitting}
              className="text-white cursor-pointer w-[300px] h-[35px] md:w-[434px] md:h-[40px] rounded-[16px] font-outfit bg-[#0060B4] shadow-custom hover:bg-[#004d91] transition-colors disabled:bg-[#7ab1e1] disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="border-2 border-brand-blue w-[300px] h-[35px] flex flex-row items-center justify-center text-[#0060B4] cursor-pointer md:w-[434px] md:h-[40px] rounded-[16px] font-outfit bg-transparent shadow-custom hover:bg-blue-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Log In With{" "}
              <Image
                src={googleLogo}
                alt="Google Logo"
                className="ml-2"
                width={20}
                height={20}
              />
            </button>
          </div>
        </form>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-20 w-full flex flex-col items-center justify-center gap-2">
        <p className="absulote font-outfit text-[7px] md:text-[10px] text-[#171717] text-center bottom-5">
          Ecole nationale Supérieure d'Informatique المدرسة الوطنية العليا
          للإعلام الآلي <br />
          BPM68 16270, Oued Smar, Alger. Tél: 023939132 ; Fax: 023939142 ;
          http://www.esi.dz
        </p>
      </div>
    </section>
  );
}