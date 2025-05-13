'use client';
import { useState } from "react";
import Nav from '@/app/components/sidebar/Sidebar';
import MobileNav from '@/app/components/NavBar/Nav';
import { Outfit } from "next/font/google";
import Header from '@/app/components/Header/Header';
import WorkerDetails from '@/app/components/Details/WorkerDetails';

const outfit = Outfit({ subsets: ["latin"] });

export default function EditWorkerPage() {
  return (
    <>
      <section className="w-full min-h-screen bg-[#f4f4f4]">
        <div className="md:hidden">
          <MobileNav />
        </div>
        <div className="hidden md:block fixed h-full">
          <Nav />
        </div>

        <div className="md:ml-[100px] flex flex-col px-4 sm:px-6">
          <div className="pt-4 hidden md:block">
            <Header title="Details" />
          </div>

          <div className="flex-1 flex justify-center items-start pt-4 mt-6 md:mt-0">
            <div className="w-full max-w-4xl">
              <WorkerDetails />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}