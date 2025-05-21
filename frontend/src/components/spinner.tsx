import React from "react"

interface SpinnerProps {
    size?: number; 
    className?: string;
}

export const Spinner:React.FC<SpinnerProps> = ({size = 40} ) =>{
    return (
        <div
            className="w-10 h-10 border-4 border-t-blue-500 border-gray-300 rounded-full animate-spin"
            style={{ width: `${size}px`, height: `${size}px` }}
            ></div>
    )
}