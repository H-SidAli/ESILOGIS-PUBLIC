import Image from "next/image";
import { Oxanium } from "next/font/google";
import Link from "next/link";
import { useState, useEffect } from "react";

// Configure the Oxanium font
const oxanium = Oxanium({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function WelcomeSection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`${oxanium.className} w-full`}>
      {isMobile ? (
        // Mobile Layout
        <div className="flex flex-col items-center text-center px-10 gap-6">
          <div className="flex">
            <Image
              src="/Images/keylogo.svg"
              alt="Key Logo"
              width={120}
              height={120}
            />
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-[26px] font-bold">
                Happy Monday FIRSTNAME,
              </h1>
              <h2 className="text-[26px] font-medium text-gray-800">What's Up ?</h2>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Link href="/user/ReportIntervention">
                <button className="bg-[#0060B4] text-white px-6 py-2.5 rounded-[10px] text-base font-medium hover:bg-blue-700">
                  Report An Issue
                </button>
              </Link>
              <p className="text-sm text-gray-600 max-w-[280px]">
                By reporting an issue, the school's technical team will
                act up to resolve the problem!
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Desktop Layout - Keep existing desktop code
        <div className="flex justify-between px-15 py-4">
          <div className="flex">
            <Image
              src="/Images/keylogo.svg"
              alt="Key Logo"
              width={200}
              height={200}
              className="mt-1"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <h1 className="text-[40px] font-bold leading-[1.1]">
                Happy Monday FIRSTNAME,
              </h1>
              <h2 className="text-[40px] font-medium text-gray-800">What's Up ?</h2>
            </div>
            <Link href="/user/ReportIntervention">
              <button className="bg-[#0060B4] text-white px-8 py-2 rounded-lg text-lg font-medium w-fit hover:bg-blue-700">
                Report An Issue
              </button>
            </Link>
            <p className="text-base text-gray-600 max-w-[320px] mt-1 leading-snug">
              By reporting an issue, the school's technical team will
              <br />
              act up to resolve the problem!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}