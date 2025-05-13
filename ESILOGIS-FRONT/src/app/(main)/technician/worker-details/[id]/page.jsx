'use client';
import Nav from '@/app/components/NavBar/Nav';
import Side from '@/app/components/sidebar/Sidebar';
import WorkerDetails from '@/app/components/Details/WorkerDetails';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/app/components/bread-crumb-nav/Bread-crumb-nav';
import arrows from "../../../../../../public/Images/arrows.svg";

// Mock function to fetch worker data
const fetchWorkerData = async (id) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return {
    id: id,
    firstName: `John    id: ${id}`,
    lastName: "Doe",
    department: id % 2 === 0 ? "Engineering" : "IT Support",
    email: `worker${id}@company.com`,
    phoneNumber: `+123456789${id}`,
    password: "SecurePass123",
    availability: [
      { day: "Monday", hours: "08:00 - 16:30" },
      { day: "Tuesday", hours: "08:00 - 16:30" },
      { day: "Wednesday", hours: "10:00 - 18:30" },
      { day: "Thursday", hours: "08:00 - 16:30" },
      { day: "Friday", hours: "08:00 - 13:00" }
    ],
    profileImage: "/Images/account_circle2.svg"
  };
};

export default function TechnicianWorkerDetailPage() {
  const [isMobile, setIsMobile] = useState(false);
  const params = useParams();
  const workerId = params.id;
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 640);
      const handleResize = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    const getWorkerData = async () => {
      try {
        setLoading(true);
        const data = await fetchWorkerData(workerId);
        setWorker(data);
      } catch (error) {
        console.error("Error fetching worker data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (workerId) getWorkerData();
  }, [workerId]);

  const breadcrumbItems = [
    { label: 'Technical Staff', href: "/technician/technical-staff" },
    { label: 'Worker Details', href: "#" }
  ];

  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden">
      <div className="hidden sm:block absolute top-0 right-0 z-10">
        <Image src={arrows} alt="" width={212}/>
      </div>
    
      <div className={`w-full z-30 ${isMobile ? 'mt-10' : 'ml-[129px]'}`}>
        <div className="">
          <h1 className="font-oxanium p-6 font-semibold text-[26.07px] h-[89px] border">
            <Breadcrumb items={breadcrumbItems}/>
          </h1>
        </div>
        <div className="w-full flex flex-col items-center justify-center mt-2 px-3 py-2 sm:px-5">
        <WorkerDetails
  workerId={workerId}
  workerData={worker}
  isEditing={false}
  isLoading={loading}
  role="technician"
/>
        </div>
      </div>
    </section>
  );
}