"use client";

import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import EquipementsTable from '@/app/components/Tables/Equipmentstable';
import arrows from "../../../../../public/Images/arrows.svg";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function EquipmentPage() {
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

  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden"> 
      <div className="hidden sm:block absolute top-0 right-0 z-10"> 
        <Image src={arrows} alt="" width={212}/>
      </div>
      
    
      
      <div className={`w-full z-30 ${isMobile ? 'mt-10' : 'ml-[129px]'}`}>
        <div className="">
          <h1 className="font-oxanium p-6 font-semibold text-[26.07px]">
            Equipments
          </h1>
        </div>

        <div className="h-[665px] overflow-y-scroll pb-30">
          <EquipementsTable />
        </div>
      </div>
      
      <div className="absolute bottom-0 right-0 p-5 text-white rounded-xl"> 
        <button className='bg-[#474747] px-24 py-1 rounded-xl'>Download as pdf</button>
      </div>
    </section>
  );
}
