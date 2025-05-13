"use client";
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import backarrow1 from "../../../../public/Images/backarrow1.svg";
import backarrow2 from "../../../../public/Images/backarrow2.svg";
import backarrow3 from "../../../../public/Images/backarrow3.svg"; 
import laptop from "../../../../public/Images/Laptop.svg";
import { useRouter } from "next/navigation";

// Create a separate component that uses useSearchParams
function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const router = useRouter();
  
  // Move useSearchParams into this component
  const { useSearchParams } = require("next/navigation");
  const searchParams = useSearchParams();
  const resetToken = searchParams.get('token'); // Get token from URL

  // Password requirements
  const requirements = [
    { id: 'length', label: 'At least 8 characters', regex: /.{8,}/ },
    { id: 'lowercase', label: 'Contains lowercase letter', regex: /[a-z]/ },
    { id: 'uppercase', label: 'Contains uppercase letter', regex: /[A-Z]/ },
    { id: 'number', label: 'Contains a number', regex: /\d/ },
    { id: 'special', label: 'Contains a special character', regex: /[!@#$%^&*(),.?":{}|<>]/ }
  ];

  // All your existing functionality
  // Verify token is present
  useEffect(() => {
    if (!resetToken) {
      setErrors({ submit: "Invalid or missing reset token. Please request a new password reset link." });
    }
  }, [resetToken]);

  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    requirements.forEach(requirement => {
      if (requirement.regex.test(password)) {
        strength += 1;
      }
    });

    setPasswordStrength(strength);
  }, [password]);

  // Check if passwords match
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords don't match" }));
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: null }));
    }
  }, [password, confirmPassword]);

  const validatePassword = () => {
    const newErrors = {};
    
    if (!resetToken) {
      newErrors.submit = "Invalid or missing reset token. Please request a new password reset link.";
      return false;
    }
    
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (passwordStrength < 3) {
      newErrors.password = "Password is too weak";
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the backend API directly
      const response = await fetch("http://localhost:3001/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: resetToken,
          password: password,
          confirmPassword: confirmPassword
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }
      
      // Show success state
      setFormSubmitted(true);
      
      // Redirect after successful password reset
      setTimeout(() => {
        router.push("/login");
      }, 3000);
      
    } catch (error) {
      console.error("Error resetting password:", error);
      setErrors({ 
        submit: error.message || "Failed to reset password. Please try again or request a new reset link." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate which requirements are met
  const getRequirementStatus = () => {
    return requirements.map(req => ({
      ...req,
      isMet: req.regex.test(password)
    }));
  };

  // Get strength color
  const getStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Get strength label
  const getStrengthLabel = () => {
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 4) return "Medium";
    return "Strong";
  };

  // If form is successfully submitted, show success message
  if (formSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 w-[300px] md:w-[434px]">
        <div className="flex justify-center w-full mb-4">
          <Image 
            src={laptop} 
            alt="Esilogis Logo" 
            width={100} 
            height={100} 
            className="w-[100px] md:w-[150px]" 
          />
        </div>
        
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-center">
          <p className="font-bold">Password Successfully Reset!</p>
          <p className="text-sm mt-2">Redirecting you to login page...</p>
          <div className="w-full bg-green-200 h-1 mt-4 overflow-hidden rounded">
            <div className="bg-green-500 h-1 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-[300px] md:w-[434px]">
      {/* Logo */}
      <div className="flex justify-center w-full mb-4">
        <Image 
          src={laptop} 
          alt="Esilogis Logo" 
          width={100} 
          height={100} 
          className="w-[100px] md:w-[150px]" 
        />
      </div>

      {/* Back Button */}
      <div 
        className="w-full flex items-start"
      > 
        <Link href="/login" className="flex flex-row items-center text-text-dark font-outfit hover:text-text-gray">
          <Image src={backarrow1} alt="Back Arrow" className="cursor-pointer" width={20} />
          <p className="ml-4 text-sm md:text-base">Go back to the Log in page</p>
        </Link>
      </div>

      {/* Title */}
      <div className="w-full text-center mb-6">
        <h1 className="font-outfit text-base md:text-lg">
          <span className="font-bold">Please</span>, enter your new <span className="font-bold">password</span>.
        </h1>
      </div>

      {/* Global error message */}
      {errors.submit && (
        <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-start">
            <div className="py-1">
              <svg className="fill-current h-4 w-4 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
              </svg>
            </div>
            <div>
              <p>{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      {/* Password Form */}
      <form onSubmit={handleSubmit} className="w-full">
        {/* Password Input */}
        <div className="mb-4">
          <label htmlFor="password" className="block font-outfit text-sm mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`border-2 rounded-[16px] w-full h-[48px] md:h-[53px] outline-none shadow-custom bg-[#EDEDED] px-4 ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : "password-requirements"}
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
          
          {errors.password && (
            <p id="password-error" className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
          
          {/* Password strength indicator */}
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${getStrengthColor()}`} 
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs">{password ? getStrengthLabel() : ""}</span>
            </div>
          </div>
          
          {/* Password requirements */}
          <div id="password-requirements" className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
            {getRequirementStatus().map(req => (
              <div key={req.id} className="flex items-center gap-1">
                <span className={req.isMet ? "text-green-500" : "text-gray-400"}>
                  {req.isMet ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                  )}
                </span>
                <span className={`text-xs ${req.isMet ? "text-green-700" : "text-gray-600"}`}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm Password Input */}
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block font-outfit text-sm mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`border-2 rounded-[16px] w-full h-[48px] md:h-[53px] outline-none shadow-custom bg-[#EDEDED] px-4 ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              aria-invalid={errors.confirmPassword ? "true" : "false"}
              aria-describedby="confirm-error"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              tabIndex="-1"
            >
              {showConfirmPassword ? (
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
          {errors.confirmPassword && (
            <p id="confirm-error" className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
          )}
          {!errors.confirmPassword && confirmPassword && (
            <p className="text-green-500 text-xs mt-1">Passwords match</p>
          )}
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isSubmitting || !resetToken}
          className="w-full h-[40px] md:h-[45px] rounded-[16px] font-outfit bg-[#0060B4] text-white shadow-custom hover:bg-[#004d91] transition-colors disabled:bg-[#7ab1e1] disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </div>
  );
}

// Main component that wraps the form in Suspense
export default function ResetPasswordPage() {
  const [imageSrc, setImageSrc] = useState(backarrow1);

  return (
    <section className="w-full h-screen flex flex-col items-center justify-center bg-[#EDEDED] relative">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>

      {/* Footer */}
      <div className="absolute bottom-10 w-full px-4">
        <p className="font-outfit text-[10px] md:text-xs text-[#171717] text-center">
          Ecole nationale Supérieure d'Informatique (ESI) <br />
          المدرسة الوطنية العليا للإعلام الآلي <br />
          BP 68M, 16270, Oued Smar, Alger. Tél: 023939132 ; Fax: 023939142 ; http://www.esi.dz
        </p>
      </div>
    </section>
  );
}