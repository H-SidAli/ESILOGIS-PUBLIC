import React from 'react';
import Image from 'next/image';
import EsiLogisFooter from '../../../../public/Images/esilogisfooter.svg';
import Vanguard from '../../../../public/Images/vanguard.svg';

export default function Footer({ isMobile }) {
  return (
    <footer className="bg-black text-white w-full py-4">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-8'} flex flex-col gap-4`}>
        <div className="flex items-center justify-between">
          <Image 
            src={EsiLogisFooter} 
            alt="ESI Logis" 
            width={isMobile ? 100 : 150}
            height={isMobile ? 30 : 45}
          />
          <Image 
            src={Vanguard} 
            alt="Vanguard" 
            width={isMobile ? 80 : 120}
            height={isMobile ? 24 : 36}
          />
        </div>
        
        <div className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'} flex flex-col sm:flex-row justify-between items-start sm:items-center`}>
          
          
          <div className={`${isMobile ? 'mt-2 sm:mt-0' : ''}`}>
            <p>2CP Equipe 07 [Vanguard] - PRJP 11
            </p>
            <div className="flex ">
              <p>2024-2025</p>
              
            </div>
            
          </div>
        </div>
      </div>
    </footer>
  );
}