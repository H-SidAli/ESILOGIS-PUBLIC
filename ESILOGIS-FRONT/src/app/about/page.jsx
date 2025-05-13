"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import backarrow1 from "../../../public/Images/backarrow1.svg";
import backarrow2 from "../../../public/Images/backarrow2.svg";
import backarrow3 from "../../../public/Images/backarrow3.svg";
import { useRouter } from "next/navigation";

export default function AboutUs() {
  const [imageSrc, setImageSrc] = useState(backarrow1);
  const router = useRouter();
  const teamMembers = [
    {
      name: "HADJI Sid Ali",
      role: "Project Manager and Back-end Developer",
      email: "ns_hadji@esi.dz"
    },
    {
      name: "ADI Adlane",
      role: "Front-end Developer",
      email: "na_adi@esi.dz"
    },
    {
      name: "OTSMANE Ahmed Rami",
      role: "UI/UX and Graphic Designer",
      email: "na_otsmane@esi.dz"
    },
    {
      name: "SAYAH Badreddine",
      role: "Front-end and Back-end Developer",
      email: "nb_sayah@esi.dz"
    },
    {
      name: "HANACHI Ouissam",
      role: "Reporter and Front-end Developer",
      email: "na_hanachi@esi.dz"
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Back button */}
      <div
        className="pt-8 pl-8"
        onMouseEnter={() => setImageSrc(backarrow2)}
        onMouseLeave={() => setImageSrc(backarrow1)}
        onClick={() => {
          router.back(), setImageSrc(backarrow3);
        }}
      >
        <Link
          href="/"
          className="flex flex-row items-center text-gray-700 font-outfit hover:text-gray-900"
        >
          <Image
            src={imageSrc}
            alt="Back Arrow"
            className="cursor-pointer"
            width={20}
          />
          <span className="ml-2 text-sm">Go back to the landing page</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto w-full mt-14 mb-10 px-15 py-10 bg-white rounded-[2.5rem] shadow-sm">
        {/* Title */}
        <h1 className="text-lg font-bold font-outfit text-black mb-8 text-[18px]">About Us</h1>
        
        {/* Vanguard section */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <Image
              src="/Images/vanguardlogo.svg"
              alt="Vanguard Logo"
              width={200}
              height={200}
              className="mr-3"
            />
            
          </div>
          <div className="space-y-4 text-black text-[20px]">
            <p className="font-outfit leading-relaxed">
              We are Vanguard, a team of second-year preparatory cycle students at Ecole Nationale Superieure d'Informatique 
              (ESI ex, INI), passionate about using technology to solve real-life problems in our academic environment.
            </p>
            <p className="font-outfit leading-relaxed">
              ESILOGIS started as a 2CP Project, built from the ground up to address a challenge we ourselves have faced:
              reporting issues on campus and tracking their resolution.
            </p>
          </div>
        </div>

        {/* Team section */}
        <div className="mt-8">
          <h2 className="text-lg font-bold font-outfit text-black mb-8 text-[26px]">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-[#F5EAEA] rounded-[2rem] flex items-center p-4 md:p-6"
                style={{ minHeight: "96px" }}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden mr-5 bg-gray-100 flex-shrink-0">
                  <img
                    src="/Images/placeholder-profile.jpg"
                    alt={`${member.name} avatar`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black font-outfit">{member.name}</h3>
                  <p className="text-sm text-gray-700 font-outfit">{member.role}</p>
                  <p className="text-xs mt-2 font-outfit">
                    <span className="text-gray-500">Contact : </span>
                    <a
                      href={`mailto:${member.email}`}
                      className="text-[#3C3C3C] underline hover:text-blue-800"
                    >
                      {member.email}
                    </a>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}