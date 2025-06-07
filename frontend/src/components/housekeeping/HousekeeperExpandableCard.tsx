'use client'; 
import React, { useState } from 'react';
import {  ChevronDown, LogOut, Bed, House, Boxes } from 'lucide-react'; 
import { CleaningTask, User } from '@/lib/types';
import { Avatar, AvatarFallback,  } from '@/components/ui/avatar';
import { CLEANING_TYPES } from '@/lib/constants';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'; 

interface HousekeeperExpandableCardProps {
    housekeeper: User; 
    cleaningTasks: CleaningTask[]; 
}


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
        case CLEANING_TYPES.PUBLIC_AREA:
            icon = <House size={16} className="text-purple-500" />;

        default: 
            icon = <Boxes size={16} className="text-red-500" />;
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
 
    const [isCardExpanded, setIsCardExpanded] = useState(false);
    // Состояние для контроля, какой раздел задач развернут ('checkout', 'current', 'zones', или null)
    const [activeTaskSection, setActiveTaskSection] = useState<string | null>(null);

    // Фильтрация задач по типу уборки
    const checkoutTasks = cleaningTasks.filter(
        (task) => task.cleaning_type === CLEANING_TYPES.DEPARTURE
    );
    const currentTasks = cleaningTasks.filter(
        (task) => task.cleaning_type === CLEANING_TYPES.STAYOVER && task.room_number
    );
    const zoneTasks = cleaningTasks.filter((task) => task.zone_name);

    const otherTasks = cleaningTasks.filter(task => ![
          CLEANING_TYPES.DEPARTURE,
          CLEANING_TYPES.STAYOVER,
          CLEANING_TYPES.PUBLIC_AREA
        ].includes(task.cleaning_type))

    return (
        <Collapsible
            open={isCardExpanded}
            onOpenChange={setIsCardExpanded}
            className="rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        >
            {/* Заголовок карточки (Имя горничной и иконка развертывания) */}
            <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                           
                            <AvatarFallback>{getInitials(housekeeper.first_name, housekeeper.last_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-lg">
                                {housekeeper.first_name} {housekeeper.last_name}
                            </p>
                            
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
            </CollapsibleTrigger>

            {/* Разворачиваемая область с разделами задач */}
            <CollapsibleContent className="p-4 border-t border-gray-100">
                {/* Раздел "Заезд" */}
                <Collapsible
                    open={activeTaskSection === 'checkout'}
                    onOpenChange={() => setActiveTaskSection(activeTaskSection === 'checkout' ? null : 'checkout')}
                    className="mb-4 last:mb-0"
                >
                    <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between py-2 px-3 rounded-md cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-200">
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
                    </CollapsibleTrigger>
                    <CollapsibleContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {checkoutTasks.length > 0 ? (
                            checkoutTasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))
                        ) : (
                            <p className="text-sm col-span-full px-3 py-1 text-gray-600">
                                Нет задач на выезд.
                            </p>
                        )}
                    </CollapsibleContent>
                </Collapsible>

                {/* Раздел "Текущая" */}
                <Collapsible
                    open={activeTaskSection === 'current'}
                    onOpenChange={() => setActiveTaskSection(activeTaskSection === 'current' ? null : 'current')}
                    className="mb-4 last:mb-0"
                >
                    <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between py-2 px-3 rounded-md cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-200">
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
                    </CollapsibleTrigger>
                    <CollapsibleContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {currentTasks.length > 0 ? (
                            currentTasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))
                        ) : (
                            <p className="text-sm col-span-full px-3 py-1 text-gray-600">
                                Нет текущих задач.
                            </p>
                        )}
                    </CollapsibleContent>
                </Collapsible>

                {/* Раздел "Зоны" */}
                <Collapsible
                    open={activeTaskSection === 'zones'}
                    onOpenChange={() => setActiveTaskSection(activeTaskSection === 'zones' ? null : 'zones')}
                    className="mb-4 last:mb-0"
                >
                    <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between py-2 px-3 rounded-md cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-200">
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
                    </CollapsibleTrigger>
                    <CollapsibleContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {zoneTasks.length > 0 ? (
                            zoneTasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))
                        ) : (
                            <p className="text-sm col-span-full px-3 py-1 text-gray-600">
                                Нет задач по зонам.
                            </p>
                        )}
                    </CollapsibleContent>
                </Collapsible>
                {/* Раздел "Другое" */}
                <Collapsible
                    open={activeTaskSection === 'other'}
                    onOpenChange={() => setActiveTaskSection(activeTaskSection === 'other' ? null : 'other')}
                    className="mb-4 last:mb-0"
                >
                    <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between py-2 px-3 rounded-md cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-200">
                            <h3 className="font-semibold text-md">
                                Другое ({otherTasks.length})
                            </h3>
                            <ChevronDown
                                size={20}
                                className={`transition-transform duration-300 ${
                                    activeTaskSection === 'other' ? 'rotate-180' : ''
                                }`}
                            />
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {otherTasks.length > 0 ? (
                            otherTasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))
                        ) : (
                            <p className="text-sm col-span-full px-3 py-1 text-gray-600">
                                Нет других задач.
                            </p>
                        )}
                    </CollapsibleContent>
                </Collapsible>
            </CollapsibleContent>
        </Collapsible>
    );
};

export default HousekeeperExpandableCard;