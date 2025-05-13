"use client";
import Image from "next/image";
import esilogislogo2 from "../../../../public/Images/esilogisLogo2.svg";
import { motion, useAnimationControls } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, Bell, X } from "lucide-react";

import File from "../../../../public/Images/file.svg";
import Codepen from "../../../../public/Images/Codepen.svg";
import Piechart from "../../../../public/Images/Pie Chart 01.svg";
import UserProfile from "../../../../public/Images/User Profile Group.svg";
import accountCircle from "../../../../public/Images/account_circle.svg";
import AlertOcta from "../../../../public/Images/Alert octagon.svg";
import Translation from "../../../../public/Images/Translation.svg";
import Openpane from "../../../../public/Images/Open Pane.svg";
import Link from "next/link"; 
import settings from "../../../../public/Images/settings.svg";
import { useRouter } from "next/navigation";

export default function Nav({email,role}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarFullyOpen, setIsSidebarFullyOpen] = useState(false);
  
  // State for temporary click effects
  const [paneClickEffect, setPaneClickEffect] = useState(false);
  const [translationClickEffect, setTranslationClickEffect] = useState(false);
  
  const controls = useAnimationControls();
  const paneIconControls = useAnimationControls();
  const translationIconControls = useAnimationControls();
  
  // Active states for click feedback
  const [menuActive, setMenuActive] = useState(false);
  const [bellActive, setBellActive] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      controls.start({ height: role === "ADMIN" ? "390px" : "300px" }).then(() => {
        setIsSidebarFullyOpen(true);
      });
    } else {
      setIsSidebarFullyOpen(false);
      controls.start({ height: "45px" });
    }
  }, [isOpen, controls,role]);
  
  const toggleMenu = () => {
    // Add haptic feedback animation
    setMenuActive(true);
    setTimeout(() => setMenuActive(false), 150);
    
    setIsOpen(!isOpen);
  };
  
  // Updated pane click handler with logout functionality
  const handlePaneClick = () => {
    // Show visual click effect
    setPaneClickEffect(true);
    setTimeout(() => setPaneClickEffect(false), 300);
    
    // Animation for haptic feedback
    paneIconControls.start({
      scale: [1, 0.85, 1],
      opacity: [1, 0, 1],
      transition: { duration: 0.2 }
    });

    // Logout functionality
    setTimeout(() => {
      // Clear any auth tokens or user data from localStorage/sessionStorage
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      
      // Redirect to login page
      router.push('../../login/');
    }, 300);
  };
  
  const handleTranslationClick = () => {
    // Only show temporary click effect without maintaining state
    setTranslationClickEffect(true);
    setTimeout(() => setTranslationClickEffect(false), 300);
    
    // Enhanced animation for haptic feedback
    translationIconControls.start({
      scale: [1, 0.85, 1],
      opacity: [1, 0.7, 1],
      transition: { duration: 0.2 }
    });
  };
  
  const navItems = [
    { 
        text: "Work Orders",
        href: role === "ADMIN" ? "#" : "/technician/workOrders",
        icon: AlertOcta,
        submenu: role === "admin" ?  [
      { text: "Reported Issues", href: "/admin/reported-issues" }, 
      { text: "Preventive Interventions", href: "/admin/preventive-interventions" }
    ] : []
      },
       { 
           icon: Piechart,  
           text: "Dashboard", 
           href: "/admin/dashboard", 
           submenu: [] // Empty submenu
         },
  
     ...(role==="ADMIN" ? [{ 
        icon: File, 
        text: "File", 
        href: "/admin/files",
        submenu: [] // Empty submenu
      }]: []),
     ...(role === "ADMIN" ? [{ 
        icon: settings,
        text: "Settings", 
        href: "#", 
   
        submenu: [ 
          { text: "Licence", href: "#" }, 
          { text: "Technical Staff", href: "/admin/technical-staff" }, 
          { text: "Users", href: "/admin/users" },
          { text: "Locations", href: "/admin/locations" },
          { text: "Departments", href: "/admin/departments" },
          { text: "Equipments", href: "/admin/equipments" },
        ]
      }] : []), 
      ...(role != "ADMIN" ? [{ 
        icon: UserProfile, 
        text: "Techical Staff", 
        href: "/technician/technical-staff",
        submenu: [] // Empty submenu
      }]: []),
    ];
  
  const handlenotifications = () => {
    // Add haptic feedback animation
    setBellActive(true);
    setTimeout(() => setBellActive(false), 150);
    
    router.push("/admin/notifications");
  };

  return (
    <motion.nav
      className="absolute flex flex-col w-[calc(100%-8px)] h-[50px] rounded-b-4xl rounded-bl-4xl rounded-t-4xl rounded-tl-4xl bg-black z-50"
      role="navigation"
      initial={{ height: "45px" }}
      animate={controls}
      transition={{ duration: 0.3 }}
    >  
      <div className="w-full pl-6 pt-2 flex justify-around items-center h-auto">
        <Image src={esilogislogo2} alt="" width={40} className="ml-1" />  
        
        <motion.div
          animate={translationIconControls}
          onClick={handleTranslationClick}
          className="cursor-pointer mx-30"
          whileTap={{ scale: 0.9 }}
        >
        </motion.div>
        
        <div className="w-fit h-fit gap-4 flex flex-row pr-6">
          <motion.div
            whileTap={{ scale: 0.85 }}
            className={`flex items-center justify-center p-1 rounded-full ${bellActive ? 'bg-[#444444]' : 'hover:bg-[#333333]'} transition-colors duration-150`}
          > 
          <Link href={`${role === "admin" ? "/admin/notifications" : "/technician/notifications"}`}> 
            <Bell 
              onClick={handlenotifications} 
              size={20} 
              className="cursor-pointer text-white"
            />
          </Link>
          </motion.div>
          
          <motion.div
            whileTap={{ scale: 0.85 }}
            className={`flex items-center justify-center p-1 rounded-full ${menuActive ? 'bg-[#444444]' : 'hover:bg-[#333333]'} transition-colors duration-150`}
            onClick={toggleMenu}
          >
            {isSidebarFullyOpen ? (
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <X 
                  size={20} 
                  className="cursor-pointer text-white"
                />
              </motion.div>
            ) : (
              <Menu 
                size={20} 
                className="cursor-pointer text-white"
              />
            )}
          </motion.div>
        </div> 
      </div>

      {isSidebarFullyOpen && isOpen && 
        <div className="w-full mt-12 h-auto flex pl-10 px-6 font-oxanium pb-9">
          <div className="w-1/2 flex flex-col gap-4 pr-2 ">
            {navItems.slice(0, 2).map((item, index) => (
              <div key={index} className="p-2 text-white border-gray-700">
                <div className="flex items-center gap-2">
                  <motion.div whileTap={{ scale: 0.9 }} className="flex items-center">
                    <Image src={item.icon} alt="" width={20} height={20} />
                  </motion.div>
                  <Link href={item.href || "#"} className="text-white text-[13px] pl-1 transition-colors hover:text-gray-300 active:text-gray-400">
                    <motion.span whileTap={{ scale: 0.95 }}>{item.text}</motion.span>
                  </Link>
                </div>
                {item.submenu.length > 0 && (
                  <div className="mr-9 pl-5 mt-1 text-xs text-gray-300">
                    {item.submenu.map((subItem, subIndex) => (
                      <Link href={subItem.href} key={subIndex}> 
                        <motion.h1 
                          whileTap={{ scale: 0.95 }}
                          className="py-1 w-auto whitespace-nowrap font-extralight pl-3 text-[13px] transition-colors hover:text-white active:text-gray-400"
                        >
                          {subItem.text}
                        </motion.h1> 
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="w-1/2 flex flex-col gap-4 pl-2">
            {navItems.slice(2).map((item, index) => (
              <div key={index} className="p-2 text-white border-gray-700">
                <div className="flex items-center gap-2">
                  <motion.div whileTap={{ scale: 0.9 }} className="flex items-center">
                    <Image src={item.icon} alt="" width={20} height={20} />
                  </motion.div>
                  <Link href={item.href || "#"} className="text-white pl-1 text-[13px] transition-colors hover:text-gray-300 active:text-gray-400">
                    <motion.span whileTap={{ scale: 0.95 }}>{item.text}</motion.span>
                  </Link>
                </div>
                {item.submenu.length > 0 && (
                  <div className="mr-12 pl-5 mt-2 text-xs text-gray-300">
                    {item.submenu.map((subItem, subIndex) => (
                      <Link href={subItem.href} key={subIndex}> 
                        <motion.h1 
                          whileTap={{ scale: 0.95 }}
                          className="py-1 w-auto whitespace-nowrap font-extralight pl-3 text-[13px] transition-colors hover:text-white active:text-gray-400"
                        >
                          {subItem.text}
                        </motion.h1> 
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div> 
      }  
      <div className="w-full flex justify-center items-center"> 
      { isSidebarFullyOpen && isOpen && <hr className="w-11/12 opacity-50" /> }
      </div>  

      <div className="w-full h-auto flex flex-row p-9 py-4">  
      { isSidebarFullyOpen && isOpen && <Image src={accountCircle} width={35} alt="accountCircle" />} 
      {isSidebarFullyOpen && isOpen &&
        <div className="flex flex-row w-full items-center justify-between p-1"> 
          <h1 className="whitespace-nowrap font-outfit text-white text-[12px]">{email}  <br /><span className="font-extralight text-[9px] opacity-55">{role}</span></h1> 
          <motion.div 
            onClick={handlePaneClick} 
            className="cursor-pointer group relative"
            whileTap={{ scale: 0.9 }}
          >
            <motion.div 
              animate={paneIconControls}
              className="relative w-6 h-6"
            >
              <div className="absolute top-0 left-0">
                <div 
                  className={`p-1 rounded-full transition-all duration-200 
                    ${paneClickEffect ? 'bg-[#CCCCCC]' : 'hover:bg-[#444444]'}`}
                >
                  <Image 
                    src={Openpane}
                    alt="Logout"
                    width={24}
                    height={24}
                  />
                </div>
              </div>
            </motion.div>
            {/* Add tooltip */}
            <div className="absolute right-0 -top-9 transform scale-0 group-hover:scale-100 transition-transform origin-bottom bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Logout
            </div>
          </motion.div>
        </div>
      }
      </div>
    </motion.nav>
  );
}

