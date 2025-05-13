"use client";

import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav";
import { useEffect, useState } from "react";
import Image from "next/image";
import arrows from "../../../../../public/Images/arrows.svg";
import DashboardContent from "@/app/components/Dashboard/Dashboard";

export default function DashboardPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window !== "undefined") {
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

  const breadcrumbItems = [
    { label: 'Dashboard', href: "#" }
  ];

  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden"> 
      <div className="hidden sm:block absolute top-0 right-0 z-10"> 
        <Image src={arrows} alt="" width={212}/>
      </div>
    
      
      <div className={`w-full z-30 ${isMobile ? 'mt-8' : 'ml-[129px]'}`}>
        <div className="">
          <h1 className="font-oxanium p-6 font-semibold text-[26.07px] border-2">
            <Breadcrumb items={breadcrumbItems}/>
          </h1>
        </div>

        <div className="  py-4 sm:py-8">
          <DashboardContent />
        </div>
      </div>
    </section>
  );
}