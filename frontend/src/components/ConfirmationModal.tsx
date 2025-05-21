'use client'

import React from "react"
import Modal from "./Modal"

interface ConfirmationModal {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}


export default function ConfirmationModal ({isOpen, message, onConfirm, onCancel, isLoading} : ConfirmationModal) {
    return (
         <Modal isOpen={isOpen} onClose={onCancel} contentClasses="max-w-sm">
            <div className="text-center"> 
               
                <p className="text-gray-700 text-lg mb-6">{message}</p>
                <div className="flex justify-center space-x-4">
                <button
                    onClick={onCancel}
                    disabled={isLoading} // Отключаем кнопку во время загрузки
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 ease-in-out"
                >
                    Отмена
                </button>

              
                <button
                    onClick={onConfirm}
                    disabled={isLoading} // Отключаем кнопку во время загрузки
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 ease-in-out"
                >
                    {isLoading ? 'Выполнение...' : 'Удалить'} {/* Изменяем текст при загрузке */}
                </button>
                </div>
            </div>
    </Modal>
    )

}