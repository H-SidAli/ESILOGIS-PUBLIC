 "use client";
 import AddTechnicalStaff from "@/app/components/Forms/AddTechnicalStaffForm"; 
 import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav"
import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import arrows from "../../../../../../public/Images/arrows.svg";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function AdminAddTechnicalStaff() {
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

    { label: 'Technical Staff', href:"../../admin/technical-staff" } , 
    { label: 'Add Staff', href:"#" }
    
  ];


  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden"> 
     <div className="hidden sm:block absolute top-0 right-0  z-10"> 
      <Image src={arrows} alt="" width={212}/>
     </div> 
      <div className={`w-full   z-30 ${isMobile ? 'mt-10' : 'ml-[129px]'}`}>
        <div className="">
          <h1 className="font-oxanium p-6 font-semibold text-[26.07px] border-2">
            <Breadcrumb items={breadcrumbItems}/>
          </h1>
        </div>

        <div className="px-10 py-15">
        <AddTechnicalStaff />
        </div>
        
      </div>
      
      <div className="absolute bottom-0 w-full">
      
      </div>
    </section>
  );
}
