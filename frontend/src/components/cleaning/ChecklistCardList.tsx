'use client';

import React, { useState } from 'react';
import { Checklist } from '@/lib/types';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
// import { Button } from "@/components/ui/button";
// import { Trash2 } from "lucide-react";

interface ChecklistCardListProps {
    checklists: Checklist[];
    checkedItemIds: number[];
    onChecklistItemChange: (checklistId: number, itemId: number) => void;
    canEditChecklist?: boolean;
}

const ChecklistCardList: React.FC<ChecklistCardListProps> = ({
    checklists,
    checkedItemIds,
    onChecklistItemChange,
    canEditChecklist = true,
}) => {
    const [expandedChecklists, setExpandedChecklists] = useState<number[]>([]);

    const toggleChecklist = (checklistId: number) => {
        setExpandedChecklists(prev =>
            prev.includes(checklistId)
                ? prev.filter(id => id !== checklistId)
                : [...prev, checklistId]
        );
    };

    return (
        <div className="space-y-4">
            {checklists.map(checklist => (
                <Card key={checklist.id} className="border shadow-md">
                    <CardHeader
                        className="cursor-pointer"
                        onClick={() => toggleChecklist(checklist.id)}
                    >
                        <CardTitle>{checklist.name}</CardTitle>
                    </CardHeader>
                    <CardContent
                        className={expandedChecklists.includes(checklist.id) ? "block" : "hidden"}
                    >
                        {checklist.items.length === 0 ? (
                            <p className="text-center text-gray-500">
                                Нет пунктов в этом чек-листе.
                            </p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {checklist.items.map(item => (
                                    <li
                                        key={item.id}
                                        className="py-2 flex items-center cursor-pointer"
                                        onClick={() => {
                                            if (canEditChecklist) {
                                                onChecklistItemChange(checklist.id, item.id);
                                            }
                                        }}
                                    >
                                        <Checkbox
                                            checked={checkedItemIds.includes(item.id)}
                                            onChange={() => {
                                                if (canEditChecklist) {
                                                    onChecklistItemChange(checklist.id, item.id);
                                                }
                                            }}
                                            className="mr-2"
                                            disabled={!canEditChecklist}
                                        />
                                        <span className={checkedItemIds.includes(item.id)
                                            ? 'line-through text-gray-500'
                                            : ''}>
                                            {item.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                   
                </Card>
            ))}
        </div>
    );
};

export default ChecklistCardList;