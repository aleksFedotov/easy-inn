const getCleaningStatusColor = (status: string | undefined) => {
        //  Та же функция, что и в page.tsx, если нужно
        switch (status) {
            case 'unassigned': return "bg-gray-100 text-gray-700";
            case 'assigned': return "bg-blue-100 text-blue-700";
            case 'in_progress': return "bg-yellow-100 text-yellow-700";
            case 'completed': return "bg-green-100 text-green-700";
            case 'waiting_inspection': return "bg-orange-100 text-orange-700";
            case 'checking': return "bg-indigo-100 text-indigo-700";
            case 'checked': return "bg-emerald-100 text-emerald-700";
            case 'canceled': return "bg-red-100 text-red-700";
            case 'on_hold': return "bg-purple-100 text-purple-700";
            default: return "bg-gray-200 text-gray-700";
        }
    };


export default getCleaningStatusColor