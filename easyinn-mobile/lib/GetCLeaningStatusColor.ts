const getCleaningStatusColor = (status: string | undefined) => {
    switch (status) {
        case 'unassigned': 
            return { backgroundColor: '#f3f4f6', textColor: '#374151' }; // gray
        case 'assigned': 
            return { backgroundColor: '#dbeafe', textColor: '#1d4ed8' }; // blue
        case 'in_progress': 
            return { backgroundColor: '#fef3c7', textColor: '#b45309' }; // yellow
        case 'completed': 
            return { backgroundColor: '#dcfce7', textColor: '#15803d' }; // green
        case 'waiting_inspection': 
            return { backgroundColor: '#fed7aa', textColor: '#c2410c' }; // orange
        case 'checking':
            return { backgroundColor: '#e0e7ff', color: '#4338ca' };    // indigo
        case 'checked': 
            return { backgroundColor: '#d1fae5', textColor: '#047857' }; // emerald
        case 'canceled': 
            return { backgroundColor: '#fee2e2', textColor: '#dc2626' }; // red
        case 'on_hold': 
            return { backgroundColor: '#f3e8ff', textColor: '#9333ea' }; // purple
        default: 
            return { backgroundColor: '#e5e7eb', textColor: '#374151' }; // gray
    }
};

export default getCleaningStatusColor;