import React, { createContext, useReducer, useContext, ReactNode } from 'react';



type State = {
    selectedDate: Date;
    searchQuery: string;
    housekeeperSearchQuery: string;
    activeTab: 'unassigned' | 'assigned' | 'all';
    selectedTasks: Record<string, boolean>; 
    isGenerating: boolean;

};


type Action =
    | { type: 'SET_DATE'; payload: Date }
    | { type: 'SET_SEARCH_QUERY'; payload: string }
    | { type: 'SET_HOUSEKEEPER_SEARCH_QUERY'; payload: string }
    | { type: 'SET_ACTIVE_TAB'; payload: 'unassigned' | 'assigned' | 'all' }
    | { type: 'SET_SELECTED_TASKS'; payload: Record<string, boolean> }
    | { type: 'SET_IS_GENERATING'; payload: boolean };


const initialState: State = {
    selectedDate: new Date(),
    searchQuery: '',
    housekeeperSearchQuery: '',
    activeTab: 'unassigned',
    selectedTasks: {},
    isGenerating: false,
};


const housekeepingReducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'SET_DATE':
        return { ...state, selectedDate: action.payload, selectedTasks: {} }; 
        case 'SET_SEARCH_QUERY':
        return { ...state, searchQuery: action.payload };
        case 'SET_HOUSEKEEPER_SEARCH_QUERY':
            return { ...state, housekeeperSearchQuery: action.payload };
        case 'SET_ACTIVE_TAB':
            return { ...state, activeTab: action.payload };
        case 'SET_SELECTED_TASKS':
            return { ...state, selectedTasks: action.payload };
        case 'SET_IS_GENERATING':
            return { ...state, isGenerating: action.payload };
        default:
        return state;
    }
};


const HousekeepingStateContext = createContext<State | undefined>(undefined);
const HousekeepingDispatchContext = createContext<React.Dispatch<Action> | undefined>(undefined);


export const HousekeepingProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(housekeepingReducer, initialState);

    return (
        <HousekeepingStateContext.Provider value={state}>
        <HousekeepingDispatchContext.Provider value={dispatch}>
            {children}
        </HousekeepingDispatchContext.Provider>
        </HousekeepingStateContext.Provider>
    );
};


export const useHousekeepingState = () => {
    const context = useContext(HousekeepingStateContext);
    if (context === undefined) {
        throw new Error('useHousekeepingState must be used within a HousekeepingProvider');
    }
    return context;
};

export const useHousekeepingDispatch = () => {
    const context = useContext(HousekeepingDispatchContext);
    if (context === undefined) {
        throw new Error('useHousekeepingDispatch must be used within a HousekeepingProvider');
    }
    return context;
};