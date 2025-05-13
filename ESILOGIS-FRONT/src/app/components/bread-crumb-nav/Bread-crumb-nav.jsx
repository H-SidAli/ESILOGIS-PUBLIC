// components/Breadcrumb.jsx
import React from 'react';
import Link from 'next/link';

/**
 * Breadcrumb component that renders a navigation trail
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items
 * @param {string} props.items[].label - Display text for the breadcrumb item
 * @param {string} props.items[].href - URL for the breadcrumb item (optional for last item)
 * @param {string} props.separator - Character or element to use as separator (default: '/')
 * @param {string} props.className - Additional CSS classes for the container
 */
const Breadcrumb = ({ 
  items = [], 
  separator = '>', 
  className = '' 
}) => {
  if (!items || items.length === 0) return null;

  return (
    <nav className={`flex items-center text-xl sm:text-[26.07px] ${className}`} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {isLast ? (
                <span className="text-black font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link 
                    href={item.href || '#'} 
                    className=" text-[#757575] "
                  >
                    <button className='cursor-poingter'>{item.label}</button>
                  </Link>
                  <span className="mx-2 text-gray-400" aria-hidden="true">
                    {separator}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;