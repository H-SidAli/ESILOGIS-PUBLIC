"use client";
import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import StaffTable from "@/app/components/staff-table/Stafftable";
import arrows from "../../../../../public/Images/arrows.svg";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function TechnicianTechnicalStaff() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sample data for development/testing
  const sampleTechnicians = [
    {
      id: "1",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      phoneNumber: "123-456-7890",
      department: "IT Support",
      availability: "Available",
      profile: "https://randomuser.me/api/portraits/men/1.jpg"
    },
    {
      id: "2",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      phoneNumber: "098-765-4321",
      department: "Engineering",
      availability: "Not available",
      profile: null
    }
  ];

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    setLoading(true);
    // For development: Use sample data
    await new Promise(resolve => setTimeout(resolve, 800));
    setTechnicians(sampleTechnicians);
    setLoading(false);
  };

  // Handler for viewing staff details
  const handleViewStaff = (id) => {
    router.push(`/technician/worker-details/${id}`);
  };

  // Department options for your organization
  const departmentOptions = [
    "IT Support",
    "Engineering",
    "Maintenance",
    "Administration",
    "Logistics"
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 640);
      const handleResize = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden">
      <div className="hidden sm:block absolute top-0 right-0 z-10">
        <Image src={arrows} alt="" width={212}/>
      </div>
     
      <div className={`w-full z-30 ${isMobile ? 'mt-28' : 'ml-[140px]'}`}>
        <div className="">
          <h1 className="font-oxanium p-6 font-semibold text-[26.07px]">
            Technical Staff
          </h1>
        </div>
        <div className="h-[calc(100vh-150px)]">
          <StaffTable
            technicians={technicians}
            loading={loading}
            onView={handleViewStaff}
            // Indicate technician role
            role="technician"
            addStaffLink={null}
            departmentOptions={departmentOptions}
            availabilityOptions={["Available", "Not available", "Desactivated"]}
          />
        </div>
      </div>
    </section>
  );
}