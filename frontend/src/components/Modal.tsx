'use client'

import React, {ReactNode} from 'react';

interface ModalProps {
    isOpen : boolean;
    onClose: () => void;
    children: ReactNode;
    contentClasses?: string;
}


export default function Modal({isOpen,onClose,children,contentClasses}: ModalProps) {
    if(!isOpen) {
        return null
    }

    return (
        <div 
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
            onClick={onClose}
            >
            <div
              className={`bg-white p-6 rounded-lg shadow-xl max-w-sm w-full relative ${contentClasses}`}
              onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    )
}
