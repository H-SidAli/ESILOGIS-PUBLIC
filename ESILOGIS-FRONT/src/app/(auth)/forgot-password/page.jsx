"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import backarrow1 from "../../../../public/Images/backarrow1.svg";
import backarrow2 from "../../../../public/Images/backarrow2.svg";
import backarrow3 from "../../../../public/Images/backarrow3.svg"; 
import laptop from "../../../../public/Images/Laptop.svg"
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [imageSrc, setImageSrc] = useState(backarrow1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setIsLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      console.log("Sending password reset link to:", email);
      // API call to backend for password reset
      const response = await fetch("http://localhost:3001/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset link");
      }
      
      // Success - show message
      setSuccess(true);
      console.log("Reset link sent successfully:", data);
    } catch (error) {
      console.error("Error sending reset link:", error);
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full h-screen flex flex-col items-center justify-center bg-[#EDEDED] relative">
      
      {/* Login Container */}
      <div className="flex flex-col items-center justify-center gap-10 w-[300px] h-[400px] md:w-[434px] md:h-[400px]">
        {/* Logo */}
        <div className="flex flex-row justify-center items-center w-[500px] h-[120px]">
          <Image src={laptop} alt="Esilogis Logo" width={100} height={100} className="w-[100px] md:w-[150px]" />
        </div>
        
        {/* Back Button */}
        <div 
          className="w-full flex items-start h-[20px]" 
          onMouseEnter={() => setImageSrc(backarrow2)}
          onMouseLeave={() => setImageSrc(backarrow1)}
          onClick={() => {router.push('/login'), setImageSrc(backarrow3)}}
        > 
          <Link href="/login" className="flex flex-row items-center text-text-dark font-outfit hover:text-text-gray">
            <Image src={imageSrc} alt="Back Arrow" className="cursor-pointer" width={20} />
            <p className="ml-4">Go back to the Log In page</p>
          </Link>
        </div>

        <div className="w-full h-[15px] md:h-[40px]">  
          <h1 className="font-outfit text-[15px] md:text-[18px]"> 
            <span className="font-bold">Please</span>, enter your <span className="font-bold">email</span> assigned to your <span className="font-bold">ESILOGIS account</span>.
          </h1>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg w-full text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg w-full text-sm">
            Password reset link has been sent to your email.
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col justify-center rounded-lg w-full mx-auto h-full">
          {/* Email Input */}
          <div className="flex flex-col items-start w-full py-2">
             <input 
              name="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="Email"
              disabled={isLoading || success}
              className="border-2 rounded-[16px] w-[300px] h-[48px] md:w-[434px] md:h-[53px] outline-none shadow-custom bg-[#EDEDED] autofill:bg-transparent px-7 disabled:opacity-70"
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col items-center justify-center w-full gap-6 mt-7">
            <button 
              type="submit" 
              disabled={isLoading || success}
              className="text-white cursor-pointer w-[300px] h-[35px] md:w-[434px] md:h-[40px] rounded-[16px] font-outfit bg-[#0060B4] shadow-custom hover:bg-[#004d91] transition-colors disabled:opacity-70 disabled:hover:bg-[#0060B4]"
            >
              {isLoading ? 'Sending...' : success ? 'Sent Successfully' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Footer */} 
      <div className="absolute bottom-20 w-full flex flex-col items-center justify-center gap-2">
        <p className="absulote font-outfit text-[7px] md:text-[10px] text-[#171717] text-center bottom-5">
          Ecole nationale Supérieure d'Informatique المدرسة الوطنية العليا للإعلام الآلي <br/>
          BPM68 16270, Oued Smar, Alger. Tél: 023939132 ; Fax: 023939142 ; http://www.esi.dz
        </p>
      </div>
    </section>
  );
}