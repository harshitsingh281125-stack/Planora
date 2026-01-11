import React from 'react'

const ActionButton = ({ label, onClick, className, icon }) => {
    const Icon = icon;
    return (
        <div className={`flex flex-row justify-center items-center gap-2 py-0.5 border-[1px] border-gray-200 rounded-xl bg-gray-100 group-hover:bg-white shadow-sm text-sm font-medium transition-colors duration-300 cursor-pointer ${className || 'w-full'}`}
            role="button"
            onClick={() => {
                onClick();
            }}
        >
            {icon && <Icon className="w-4 h-4 text-black" />}
            {label}
        </div>
    )
}

export default ActionButton