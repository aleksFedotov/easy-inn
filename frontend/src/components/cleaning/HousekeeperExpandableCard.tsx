'use client'; // Указываем, что это клиентский компонент

import React, { useState } from 'react';
import {  ChevronDown, LogOut, Bed, House } from 'lucide-react'; // Импорт иконок
import { CleaningTask, User } from '@/lib/types'; // Импорт типов User и CleaningTask
import { Avatar, AvatarFallback,  } from '@/components/ui/avatar';
import { CLEANING_TYPES } from '@/lib/constants';

// Интерфейс для пропсов компонента HousekeeperExpandableCard
interface HousekeeperExpandableCardProps {
    housekeeper: User; // Объект горничной
    cleaningTasks: CleaningTask[]; // Список задач, назначенных этой горничной
}

// Вспомогательная функция для генерации инициалов
const getInitials = (firstName?: string, lastName?: string): string => {
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
};

// Компонент для отображения одной задачи внутри карточки горничной
const TaskCard: React.FC<{ task: CleaningTask; }> = ({ task }) => {
    let icon;
    // Определяем иконку в зависимости от типа уборки
    switch (task.cleaning_type) {
        case CLEANING_TYPES.DEPARTURE: 
            icon = <LogOut size={16} className="text-blue-500" />;
            break;
        case CLEANING_TYPES.STAYOVER: 
            icon = <Bed size={16} className="text-green-500" />;
            break;
        default: 
            icon = <House size={16} className="text-purple-500" />;
            break;
    }

    return (
        <div className="flex items-center space-x-2 p-2 rounded-md border border-gray-200">
            {icon}
            <span className="text-sm font-medium">
                {task.room_number || task.zone_name || 'Не указано'}
            </span>
        </div>
    );
};

// Основной компонент расширяемой карточки горничной
const HousekeeperExpandableCard: React.FC<HousekeeperExpandableCardProps> = ({
    housekeeper,
    cleaningTasks,
}) => {
    // Состояние для контроля, развернута ли основная карточка горничной
    const [isCardExpanded, setIsCardExpanded] = useState(false);
    // Состояние для контроля, какой раздел задач развернут ('checkout', 'current', 'zones', или null)
    const [activeTaskSection, setActiveTaskSection] = useState<string | null>(null);

    // Функция для переключения состояния развернутости основной карточки
    const toggleCardExpansion = () => setIsCardExpanded(!isCardExpanded);

    // Функция для переключения состояния развернутости раздела задач
    const toggleTaskSection = (section: string) => {
        setActiveTaskSection(activeTaskSection === section ? null : section);
    };

    // Фильтрация задач по типу уборки
    const checkoutTasks = cleaningTasks.filter(
        (task) => task.cleaning_type === CLEANING_TYPES.DEPARTURE
    );
    const currentTasks = cleaningTasks.filter(
        (task) => task.cleaning_type === CLEANING_TYPES.STAYOVER && task.room_number
    );
    const zoneTasks = cleaningTasks.filter((task) => task.zone_name);

    return (
        <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-white">
            {/* Заголовок карточки (Имя горничной и иконка развертывания) */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={toggleCardExpansion}
            >
                <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                        {/* Если у горничной есть URL изображения, используйте AvatarImage */}
                        {/* <AvatarImage src={housekeeper.profile_picture_url} alt={`${housekeeper.first_name} ${housekeeper.last_name}`} /> */}
                        <AvatarFallback>{getInitials(housekeeper.first_name, housekeeper.last_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-lg">
                            {housekeeper.first_name} {housekeeper.last_name}
                        </p>
                        {/* Можно добавить общую статистику здесь, если нужно */}
                        <p className="text-sm">
                            Всего задач: {cleaningTasks.length}
                        </p>
                    </div>
                </div>
                <ChevronDown
                    size={24}
                    className={`transition-transform duration-300 ${
                        isCardExpanded ? 'rotate-180' : ''
                    }`}
                />
            </div>

            {/* Разворачиваемая область с разделами задач */}
            {isCardExpanded && (
                <div className="p-4 border-t border-gray-100">
                    {/* Раздел "Заезд" */}
                    <div className="mb-4 last:mb-0">
                        <div
                            className="flex items-center justify-between py-2 px-3 rounded-md cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => toggleTaskSection('checkout')}
                        >
                            <h3 className="font-semibold text-md">
                                Заезд ({checkoutTasks.length})
                            </h3>
                            <ChevronDown
                                size={20}
                                className={`transition-transform duration-300 ${
                                    activeTaskSection === 'checkout' ? 'rotate-180' : ''
                                }`}
                            />
                        </div>
                        {activeTaskSection === 'checkout' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {checkoutTasks.length > 0 ? (
                                    checkoutTasks.map((task) => (
                                        <TaskCard key={task.id} task={task} />
                                    ))
                                ) : (
                                    <p className="text-sm col-span-full px-3 py-1">
                                        Нет задач на выезд.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Раздел "Текущая" */}
                    <div className="mb-4 last:mb-0">
                        <div
                            className="flex items-center justify-between py-2 px-3 rounded-md cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => toggleTaskSection('current')}
                        >
                            <h3 className="font-semibold text-md">
                                Текущая ({currentTasks.length})
                            </h3>
                            <ChevronDown
                                size={20}
                                className={`transition-transform duration-300 ${
                                    activeTaskSection === 'current' ? 'rotate-180' : ''
                                }`}
                            />
                        </div>
                        {activeTaskSection === 'current' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {currentTasks.length > 0 ? (
                                    currentTasks.map((task) => (
                                        <TaskCard key={task.id} task={task} />
                                    ))
                                ) : (
                                    <p className="text-sm col-span-full px-3 py-1">
                                        Нет текущих задач.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Раздел "Зоны" */}
                    <div className="mb-4 last:mb-0">
                        <div
                            className="flex items-center justify-between py-2 px-3 rounded-md cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => toggleTaskSection('zones')}
                        >
                            <h3 className="font-semibold text-md">
                                Зоны ({zoneTasks.length})
                            </h3>
                            <ChevronDown
                                size={20}
                                className={`transition-transform duration-300 ${
                                    activeTaskSection === 'zones' ? 'rotate-180' : ''
                                }`}
                            />
                        </div>
                        {activeTaskSection === 'zones' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {zoneTasks.length > 0 ? (
                                    zoneTasks.map((task) => (
                                        <TaskCard key={task.id} task={task} />
                                    ))
                                ) : (
                                    <p className="text-sm col-span-full px-3 py-1">
                                        Нет задач по зонам.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HousekeeperExpandableCard;