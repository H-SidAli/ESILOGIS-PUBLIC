"use client";

import "./globals.css";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Oxanium } from 'next/font/google';
import { Outfit } from 'next/font/google';
const oxanium = Oxanium({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-oxanium',
});


const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-outfit',
});

export default function RootLayout({ children }) {
  // Use useState instead of useRef for initial render
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // Check for first visit
    const firstVisit = sessionStorage.getItem("firstVisit");
    if (!firstVisit) {
      sessionStorage.setItem("firstVisit", "true");
    } else {
      setHasLoaded(true);
    }
  }, []); // Add dependency array

  return (
    <html lang="en" className={oxanium.variable + " " + outfit.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Oxanium:wght@300..800&family=Outfit:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="relative">
        {!hasLoaded ? (
          <motion.div

            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
