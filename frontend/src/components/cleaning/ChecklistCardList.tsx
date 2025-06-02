'use client';

import React, { useState, useEffect } from 'react';
import { Checklist, ChecklistProgress } from '@/lib/types';
import {
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from 'lucide-react';


interface ChecklistCardListProps {

    checklist: Checklist;
    onChange: (checklistId: number, progress: ChecklistProgress) => void;
}

const ChecklistCardList: React.FC<ChecklistCardListProps> = ({
    checklist,
    onChange
}) => {
    const [isCardExpanded, setIsCardExpanded] = useState(false);
    const [checkedItemIds, setCheckedItemIds] = useState<number[]>([]);

    const toggleCard = () => {
        setIsCardExpanded(!isCardExpanded);
    };

    // При изменении списка отмеченных пунктов вызываем onChange
    useEffect(() => {
        onChange(checklist.id, {
            total: checklist.items.length,
            completed: checkedItemIds.length
        });
    }, [checkedItemIds, checklist.id, checklist.items.length, onChange]);

    const handleCheckboxChange = (itemId: number) => {
        setCheckedItemIds((prev) =>
            prev.includes(itemId)
                ? prev.filter((id) => id !== itemId)
                : [...prev, itemId]
        );
    };

    return (
        <div className="p-4 border-t border-gray-100">
            <CardHeader className="cursor-pointer" onClick={toggleCard}>
                <div className="flex items-center justify-between">
                    <CardTitle>{checklist.name}</CardTitle>
                    <ChevronDown
                        size={20}
                        className={`text-gray-500 transition-transform duration-300 ${
                            isCardExpanded ? 'rotate-180' : ''
                        }`}
                    />
                </div>
            </CardHeader>
            <CardContent className={isCardExpanded ? "block" : "hidden"}>
                {checklist.items.length === 0 ? (
                    <p className="text-center text-gray-500">
                        Нет пунктов в этом чек-листе.
                    </p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {checklist.items.map((item) => (
                            <li
                                key={item.id}
                                className="py-2 flex items-center cursor-pointer"
                                onClick={() => handleCheckboxChange(item.id)}
                            >
                                <Checkbox
                                    checked={checkedItemIds.includes(item.id)}
                                    onChange={() => {}}
                                    className="mr-2"
                                />
                                <span className={
                                    checkedItemIds.includes(item.id)
                                        ? 'line-through text-gray-500'
                                        : ''
                                }>
                                    {item.text}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </div>
    );
};

export default ChecklistCardList;
