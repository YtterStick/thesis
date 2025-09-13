import React from 'react';

const Tooltip = ({ children, content }) => {
  return (
    <div className="tooltip-container">
      <div className="relative">
        <div className="group peer relative z-10">
          {children}
        </div>
        <div className="absolute left-1/2 w-auto -translate-x-1/2 rounded bg-gray-400 p-2 text-sm text-white opacity-0 transition-opacity duration-500 before:absolute before:-bottom-1 before:left-1/2 before:size-2 before:-translate-x-1/2 before:rotate-45 before:bg-gray-400 before:content-[''] peer-hover:opacity-100 dark:bg-slate-800 dark:text-white dark:before:bg-slate-800">
          <p className="text-center whitespace-nowrap">{content}</p>
        </div>
      </div>
    </div>
  );
}

export default Tooltip;