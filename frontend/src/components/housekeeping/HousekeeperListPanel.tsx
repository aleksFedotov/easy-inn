import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User as UserIcon, Search } from 'lucide-react';
import { User, CleaningTask } from '@/lib/types';
import HousekeeperExpandableCard from './HousekeeperExpandableCard';
import { useHousekeepingState, useHousekeepingDispatch } from '@/context/HousekeepingContext';


interface HousekeeperListPanelProps {
    housekeepers: User[];
    cleaningTasks: CleaningTask[];
    onOpenSelection: () => void;
    isLoading?: boolean;
    isDisabled?: boolean;
}
const  HousekeeperListPanel: React.FC<HousekeeperListPanelProps> = ({
    housekeepers,
    cleaningTasks,
    onOpenSelection,
    isLoading,
    isDisabled
}) => {
    const {housekeeperSearchQuery } = useHousekeepingState() 
    const dispatch = useHousekeepingDispatch();
    const onSearchChange = (query: string) => {
        dispatch({ type: 'SET_HOUSEKEEPER_SEARCH_QUERY', payload: query }); 
    }



    const filteredHousekeepers = useMemo(() => {
        if (!housekeeperSearchQuery) {
            return housekeepers;
        }
        const query = housekeeperSearchQuery.toLowerCase();
        return housekeepers.filter(
            h => h.first_name.toLowerCase().includes(query) || h.last_name.toLowerCase().includes(query)
        );
    }, [housekeepers, housekeeperSearchQuery]);

    return (
        <div className="md:col-span-1 shadow-md rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
            <UserIcon size={20} className="mr-2" /> Горничные
        </h2>

        <div className="relative mb-4">
            <Input
            type="text"
            placeholder="Поиск горничных..."
            value={housekeeperSearchQuery }
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            />
            <Search size={20} className="absolute left-3 top-2.5 text-muted-foreground" />
        </div>

        <Button
            variant="outline"
            onClick={onOpenSelection}
            className="w-full mb-4"
            disabled={isLoading || isDisabled}
        >
            Выбрать горничных
        </Button>

        <div className="space-y-4">
            {filteredHousekeepers.length > 0 ? (
            filteredHousekeepers.map(housekeeper => (
                <HousekeeperExpandableCard
                key={housekeeper.id}
                housekeeper={housekeeper}
                cleaningTasks={cleaningTasks.filter(task => task.assigned_to === housekeeper.id)}
                />
            ))
            ) : (
            <p className="text-center">Горничные не выбраны.</p>
            )}
        </div>
        </div>
    );
}


export default React.memo(HousekeeperListPanel);