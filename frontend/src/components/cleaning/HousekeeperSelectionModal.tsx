'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { User } from '@/lib/types'; // Assuming User type is defined here
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface HousekeeperSelectionModalProps {
    availableHousekeepers: User[];
    initialSelectedHousekeeperIds: number[];
    onConfirm: (selectedIds: number[]) => void;
    onClose: () => void;
    isMultiSelect?: boolean;
}

/**
 * HousekeeperSelectionModal component allows users to select housekeepers from a list.
 * It features a search bar and checkboxes for multi-selection.
 *
 * @param {HousekeeperSelectionModalProps} { availableHousekeepers, initialSelectedHousekeeperIds, onConfirm, onClose } - Props for the component.
 * @returns {JSX.Element} The HousekeeperSelectionModal component.
 */
const HousekeeperSelectionModal: React.FC<HousekeeperSelectionModalProps> = ({
    availableHousekeepers,
    initialSelectedHousekeeperIds,
    onConfirm,
    onClose,
    isMultiSelect,
     
}) => {
    const [tempSelectedHousekeeperIds, setTempSelectedHousekeeperIds] = useState<number[]>(initialSelectedHousekeeperIds);
    const [searchQuery, setSearchQuery] = useState('');

    // Update internal state if initialSelectedHousekeeperIds changes (e.g., when modal reopens)
    useEffect(() => {
        setTempSelectedHousekeeperIds(initialSelectedHousekeeperIds);
    }, [initialSelectedHousekeeperIds]);

    const handleCheckboxChange = useCallback((housekeeperId: number, checked: boolean) => {
    if (isMultiSelect) {
        setTempSelectedHousekeeperIds(prevSelected =>
            checked
                ? [...prevSelected, housekeeperId]
                : prevSelected.filter(id => id !== housekeeperId)
        );
    } else {
        setTempSelectedHousekeeperIds(checked ? [housekeeperId] : []);
    }
}, [isMultiSelect]);

    const filteredHousekeepers = availableHousekeepers.filter(h =>
        h.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.last_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleConfirm = () => {
        const selectedIds = Array.from(tempSelectedHousekeeperIds);
        onConfirm(selectedIds);
    };

    return (
        <DialogContent className="max-w-md md:max-w-lg lg:max-w-xl">
            <DialogHeader>
                <DialogTitle>Выбрать горничных</DialogTitle>
                <DialogDescription>
                    Выберите одну или несколько горничных из списка.
                </DialogDescription>
            </DialogHeader>
            <div className="relative mb-4">
                <Input
                    type="text"
                    placeholder="Поиск горничных..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
                <Search size={20} className="absolute left-3 top-2.5 text-muted-foreground" />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                {filteredHousekeepers.length > 0 ? (
                    filteredHousekeepers.map(housekeeper => (
                        <div
                            key={housekeeper.id}
                            className="flex items-center space-x-3 p-2 border rounded-md hover:bg-gray-50 transition-colors"
                        >
                           
                            <Checkbox
                                id={`housekeeper-${housekeeper.id}`}
                                checked={tempSelectedHousekeeperIds.includes(housekeeper.id)}
                                onCheckedChange={(checked) => handleCheckboxChange(housekeeper.id, !!checked)}
                                disabled={!isMultiSelect && tempSelectedHousekeeperIds.length > 0 && !tempSelectedHousekeeperIds.includes(housekeeper.id)}
                            />
                            <label
                                htmlFor={`housekeeper-${housekeeper.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                            >
                                {housekeeper.first_name} {housekeeper.last_name}
                            </label>
                        </div>
                    ))
                ) : (
                    <p className="text-center">Горничные не найдены.</p>
                )}
            </div>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={onClose}>
                    Отмена
                </Button>
                <Button onClick={handleConfirm}>
                    Подтвердить выбор
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default HousekeeperSelectionModal;
