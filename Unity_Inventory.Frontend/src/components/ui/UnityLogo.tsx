import React from 'react';

export const UnityLogo = ({ size = 24, className = "" }: { size?: number, className?: string }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main Stylized U */}
      <path 
        d="M30 20V65C30 76 39 85 50 85C61 85 70 76 70 65V50H80V65C80 81.5 66.5 95 50 95C33.5 95 20 81.5 20 65V20H30Z" 
        fill="currentColor" 
      />
      
      {/* Isometric Box / Product Icon */}
      <path 
        d="M40 35L55 25L70 35V50L55 60L40 50V35Z" 
        fill="currentColor" 
      />
      <path 
        d="M40 35L55 45L70 35M55 45V60" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Network / Connectivity Nodes */}
      <circle cx="85" cy="25" r="5" fill="currentColor" />
      <circle cx="92" cy="45" r="4" fill="currentColor" />
      <circle cx="88" cy="65" r="3" fill="currentColor" />
      <circle cx="82" cy="80" r="2" fill="currentColor" />
      
      <path 
        d="M85 25L92 45L88 65L82 80" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
    </svg>
  );
};
