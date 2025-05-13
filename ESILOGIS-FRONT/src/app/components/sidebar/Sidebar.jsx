"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useAnimationControls, AnimatePresence, hover } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
// Icons
import esilogislogo2 from "../../../../public/Images/esilogisLogo2.svg";
import Bell from "../../../../public/Images/Bell 02.svg";
import File from "../../../../public/Images/file.svg";
import Codepen from "../../../../public/Images/Codepen.svg";
import Piechart from "../../../../public/Images/Pie Chart 01.svg";
import UserProfile from "../../../../public/Images/User Profile Group.svg";
import accountCircle from "../../../../public/Images/account_circle.svg"
import AlertOcta from "../../../../public/Images/Alert octagon.svg";
import workorderorange from "../../../../public/Images/work order orange.svg";
import BellO from "../../../../public/Images/Bell 3 Orange.svg"; 
import FileO from "../../../../public/Images/FileOrange.svg";
import CodepenO from "../../../../public/Images/CodepenOrange.svg";
import PiechartO from "../../../../public/Images/Pie Chart 01 Orange.svg";
import UserProfileO from "../../../../public/Images/User Profile Orange.svg";
import Translation from "../../../../public/Images/Translation.svg"; 
import  Settings  from "../../../../public/Images/settings.svg"
import  SettingsO  from "../../../../public/Images/settings orange.svg" 
import { icons } from "lucide-react";
export default function Side({ email , role }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarFullyOpen, setIsSidebarFullyOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const controls = useAnimationControls();
  const router = useRouter();
  
  // Create refs for each menu item
  const itemRefs = useRef([]);
  const submenuRefs = useRef([]);
  const baseHeight = 60; // Base height for menu items - reduced from 80

  // Calculate responsive sidebar widths based on screen size
  const getClosedWidth = () => {
    if (windowWidth < 640) return "70px";  // mobile
    if (windowWidth < 1024) return "100px"; // tablet
    return "130px"; // desktop
  };

  const getOpenWidth = () => {
    if (windowWidth < 640) return "180px";  // mobile
    if (windowWidth < 1024) return "220px"; // tablet
    return "250px"; // desktop
  };

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      controls.start({ width: getOpenWidth() }).then(() => setIsSidebarFullyOpen(true));
    } else {
      setIsSidebarFullyOpen(false);
      controls.start({ width: getClosedWidth() });
    }
  }, [isOpen, controls, windowWidth]);

  const handleItemHover = (index) => {
    setHoveredIndex(index);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    router.push("/login");
  };

  

  // Calculate the expanded height for a menu item based on its submenu
  const getExpandedHeight = (index, item) => {
    // If not hovered or submenu is empty, return base height
    if (hoveredIndex !== index || !item.submenu || item.submenu.length === 0) {
      return baseHeight;
    }
    
    // If hovered but submenu ref doesn't exist yet, use a default expanded height
    if (!submenuRefs.current[index]) {
      return baseHeight + 40;
    }
    
    // Return base height plus submenu height
    const submenuHeight = submenuRefs.current[index].scrollHeight;
    return baseHeight + submenuHeight;
  };

  const navItems = [
  { 
    icon: Bell, 
    text: "Notification", 
    href: role === "ADMIN" ? "../../admin/notifications": "../../technician/notifications", 
    hover: BellO,
    submenu: [] // Empty submenu
  },
  {  
    text: "Work Orders",
    href: role === "ADMIN" ? "#" : "/technician/workOrders",
    icon: AlertOcta,
    hover: workorderorange,
    submenu: role === "ADMIN" ?  [
      { text: "Reported Issues", href: "/admin/reported-issues" }, 
      { text: "Preventive Interventions", href: "/admin/preventive-interventions" }
    ] : []
  },
  { 
    icon: Piechart, 
    text: "Dashboard", 
    href: role === "ADMIN" ? "/admin/dashboard" : "/technician/Dashboard", 
    hover: PiechartO,
    submenu: [] // Empty submenu
  },
 ...(role==="ADMIN" ? [{ 
    icon: File, 
    text: "File", 
    href: "/admin/files",
    hover: FileO,
    submenu: [] // Empty submenu
  }]: []),
  // Admin-only settings option
  ...(role === "ADMIN" ? [{ 
    icon: Settings,
    text: "Settings", 
    href: "#", 
    hover: SettingsO, 
    submenu: [ 
      { text: "Licence", href: "#" }, 
      { text: "Technical Staff", href: "/admin/technical-staff" }, 
      { text: "Users", href: "/admin/users" },
      { text: "Locations", href: "/admin/locations" },
      { text: "Departments", href: "/admin/departments" },
      { text: "Equipments", href: "/admin/equipments" },
      { text: "Equipments Type", href: "/admin/equipments/equipement-types" },
    ]
  }] : []), 
  ...(role != "ADMIN" ? [{icon:UserProfile, 
    hover: UserProfileO, 
    text : "Technical Staff", 
    href:"../../technician/technical-staff", 
    submenu: []
  }] : []),
];
  return (
    <motion.nav
      className="absolute flex flex-col rounded-2xl h-[calc(100vh-8px)] bg-black z-50"
      role="navigation"
      initial={{ width: getClosedWidth() }}
      animate={controls}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Logo */}
      <div className="p-5 pt-10 w-full flex items-center justify-center">
        <Image src={esilogislogo2} alt="Esilogis Logo" className="ml-1 max-w-full h-auto" />
      </div>
      
      {/* Divider */}
      <div className="w-full flex flex-col items-center justify-center">
        <motion.div
          className="h-[2px] bg-white"
          initial={{ width: "60%" }}
          animate={{ width: isOpen ? "80%" : "60%" }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {/* Navigation Items */}
      <ul className="w-full h-8/12 flex flex-col">
        {navItems.map((item, index) => (
          <motion.li
            key={index}
            ref={el => itemRefs.current[index] = el}
            className="w-full p-4 sm:p-6 md:p-9 pl-4 sm:pl-6 md:pl-8 relative group"
            onMouseEnter={() => handleItemHover(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            animate={{ 
              height: getExpandedHeight(index, item)
            }}
            transition={{ duration: 0.3 }}
            style={{ overflow: hoveredIndex === index && item.submenu.length > 0 ? "visible" : "hidden" }}
          >
            <Link href={item.href} className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="relative ml-2 sm:ml-3 md:ml-4 w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] md:w-[25px] md:h-[25px]">
                {/* Show regular icon when not hovered */}
                {hoveredIndex !== index && (
                  <Image src={item.icon} width={25} height={25} alt="" className="w-full h-full" />
                )}
                {/* Show orange icon when hovered */}
                {hoveredIndex === index && (
                  <Image src={item.hover} width={25} height={25} alt="" className="w-full h-full" />
                )}
              </div>
              {isOpen && isSidebarFullyOpen && (
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.1 }}
                  className={`whitespace-nowrap font-oxanium font-semibold text-xs sm:text-sm md:text-base ${hoveredIndex === index ? "text-[#EA8B00]" : "text-white"}`}
                >
                  {item.text}
                </motion.p>
              )}
            </Link>
            
            <AnimatePresence>
              {hoveredIndex === index && isOpen && item.submenu.length > 0 && (
                <motion.div
                  ref={el => submenuRefs.current[index] = el}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col mt-1 absolute left-0 w-full pl-12 sm:pl-16 md:pl-[90px]"
                >
                  {item.submenu.map((subItem, subIndex) => (
                    <Link href={subItem.href} 
                      key={subIndex}
                      className="py-0.5 text-[10px] sm:text-[11px] md:text-[13px] whitespace-nowrap text-white font-oxanium font-extralight opacity-80 hover:text-[#EA8B00] transition-colors duration-200"
                    >
                      {subItem.text}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        ))}
      </ul>
      
      {/* Bottom Profile Info */}
      <div className="w-full h-[139px] mt-auto items-start justify-center p-3 sm:p-4 md:p-6 flex flex-col ">        
       <div className="w-full h-12 flex flex-row items-center ">
  <Image src={accountCircle} alt="Profile Icon" width={40} height={40} className="ml-2 sm:ml-2.5 md:ml-[13px] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" /> 
  <div className="w-full h-full flex flex-col justify-start  "> 
  {isOpen && ( 
    <>
      <h1 className="text-white text-[10px] sm:text-[12px] md:text-[13px] font-outfit whitespace-nowrap ml-0.5 ">
        {email}
        <br />
        <span className="font-extralight opacity-55 text-[8px] sm:text-[10px] md:text-[13px]">{role}</span>
      </h1> 
      <AnimatePresence>
        {isSidebarFullyOpen && (
          <motion.button 
            onClick={handleLogout} 
            className="bg-black text-xs border-2 rounded-4xl border-white text-white py-0.5 hover:bg-white hover:text-black transition-colors"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Log out
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )}  
  </div>
</div>
     
      </div>
    </motion.nav>
  );
}