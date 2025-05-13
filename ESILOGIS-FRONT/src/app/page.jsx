"use client";
import EsiLogo from "../../public/Images/esiLogo.svg";
import EsilogisLogo from "../../public/Images/esilogisLogo.svg";
import vanguardLogo from "../../public/Images/vanguardlogo.svg";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import arrowsup from "../../public/Images/arrows up.svg";
import arrowsdown from "../../public/Images/arrows down.svg";

export default function Home() {
  const [isClicked2, setClicked2] = useState(false);

  return (
    <section className="w-full min-h-screen flex flex-col items-center justify-start bg-[#EDEDED] relative overflow-x-hidden pb-10">
      {/* Arrows decorations positioned with more spacing */}
      <div className="absolute top-0 right-0 z-0">
        <Image
          src={arrowsdown}
          alt=""
          width={300}
          className="md:w-md lg:w-xl"
          priority
        />
      </div>
      
      <div className="absolute bottom-0 left-0 z-0">
        <Image
          src={arrowsup}
          alt=""
          width={190}
          className="md:w-[280px] lg:w-[350px]"
          priority
        />
      </div>

      {/* Main content with padding to avoid overlapping with arrows */}
      <div className="flex flex-col w-[300px] md:w-[450px] mt-24 z-10">
        {/* Logos */}
        <div className="flex flex-row items-baseline justify-center gap-10 w-full mb-8">
          <Image
            src={EsiLogo}
            alt="esi logo"
            className="w-[64.06px] md:w-[95.52px]"
          />
          <Image
            src={EsilogisLogo}
            alt="esilogis logo"
            className="w-[77.46px] md:w-[115.516px]"
          />
        </div>

        {/* Welcome heading */}
        <div className="flex justify-center w-full">
          <h1 className="tracking-wide font-outfit mb-5 text-[22px] md:text-[39px]">
            Welcome to{" "}
            <span className="text-[#00A3FF] font-bold">
              ESILOGIS
            </span>
            !
          </h1>
        </div>

        {/* Description */}
        <div className="w-full flex flex-col items-center justify-center gap-3">
          <p className="font-outfit font-normal text-justify leading-tight tracking-wide text-[13px] md:text-[18px]">
            ESILOGIS is a web platform designed to simplify issue reporting
            within the Higher National School of Computer Science (ESI Algiers).
            Whether it's broken equipment, faulty infrastructure, or any
            logistical problem, our system ensures that students, staff, and
            faculty can easily report issues, while administrators and
            technician efficiently track and resolve them.
          </p>
          <p className="tracking-wide font-outfit font-light text-[9px] md:text-[12px] mb-6">
            Report. Track. Resolve. Together, we keep ESI running smoothly!
          </p>
        </div>

        {/* Objectives section */}
        <div className="w-full max-w-xl p-3 mb-3">
          <h2 className="font-bold text-lg mb-4">Objectives</h2>

          <ul className="space-y-6">
            <li className="flex">
              <div className="mr-2 mt-1 text-black">•</div>
              <div>
                <p className="font-semibold">
                  Students and faculty submit work requests through an
                  easy-to-access portal on their smartphones.
                </p>
                <p className="text-sm text-gray-600">
                  They can attach a photo to show exactly where the problem is
                  occurring.
                </p>
              </div>
            </li>

            <li className="flex">
              <div className="mr-2 mt-1 text-black">•</div>
              <div>
                <p className="font-semibold">
                  Technicians are alerted when they are assigned a work order.
                </p>
                <p className="text-sm text-gray-600">
                  Technicians can comment on the work order if they are missing
                  any tools, or communicate with administration on the status of
                  a work order if it is put in progress.
                </p>
              </div>
            </li>

            <li className="flex">
              <div className="mr-2 mt-1 text-black">•</div>
              <div>
                <p className="font-semibold">
                  Access equipments information from anywhere.
                </p>
                <p className="text-sm text-gray-600">
                  New to the team? Not an issue. Technicians can easily open up
                  equipment information to see a record of all historical
                  repairs, so they know the exact procedures that have worked in
                  the past.
                </p>
              </div>
            </li>
          </ul>
        </div>
        {/* Action buttons */}
        <div className="w-full flex flex-col items-center justify-center gap-2 mb-6">
          <Link href="./login" className="w-full">
            <button
              className={`${
                isClicked2 ? "bg-[#3EAFFF]" : "bg-[#0060B4]"
              } text-[12px] w-full h-[28.1px] md:h-[40px] rounded-[17.1px] shadow-xl text-white font-outfit md:text-[17px] cursor-pointer hover:bg-gradient-to-r from-[#0060B4] via-[#00E7F4] to-[#0060B4]`}
              onClick={() => setClicked2(!isClicked2)}
            >
              Get Started
            </button>
          </Link>
          <Link href="./about" className="w-full">
            <button
              className="text-[12px] w-full h-[28.1px] md:h-[40px] border border-gray-400 bg-white rounded-[17.1px] shadow-xl font-outfit md:text-[17px] cursor-pointer hover:bg-gray-50"
              onClick={() => setClicked2(!isClicked2)}
            >
              About
            </button>
          </Link>
        </div>

        {/* Vanguard logo and info */}
        <div className="w-full flex flex-col items-center justify-center gap-1 mb-20 md:mb-10">
  <Image
    src={vanguardLogo}
    alt="esi logo"
    width={150}
    height={150}
  />
  <p className="tracking-wide font-outfit font-light text-[10px] md:text-[16px] cursor-pointer hover:underline">
    2CP Equipe 07 [Vanguard] - PRJP 11
  </p>
  <p className="tracking-wide font-outfit font-light text-[10px] md:text-[16px] cursor-pointer hover:underline">
    2024-2025
  </p>
</div>
      </div>

      {/* Footer text - uncomment if needed */}
      {/*
      <div className="w-full flex justify-center mt-auto mb-4 z-10 px-4">
        <p className="font-outfit text-[7px] md:text-[10px] text-[#171717] text-center">
          Ecole nationale Supérieure d'Informatique المدرسة الوطنية العليا للإعلام الآلي <br/>
          BPM68 16270, Oued Smar, Alger. Tél: 023939132 ; Fax: 023939142 ; http://www.esi.dz
        </p>
      </div>
      */}
    </section>
  );
}