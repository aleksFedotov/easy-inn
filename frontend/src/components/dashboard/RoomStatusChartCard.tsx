import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { RoomStatuses } from '@/lib/types'; // Убедитесь, что у вас есть этот тип
import { COLORS } from '@/lib/constants'; // COLORS лучше вынести в constants.ts, если они используются в разных местах

interface RoomStatusChartCardProps {
  roomStatuses: RoomStatuses;
}

const statusTranslation: Record<string, string> = {
  clean: 'Чистый',
  dirty: 'Грязный',
  in_progress: 'Убирается',
  waiting_inspection: 'Ожидает проверки',
  free: 'Свободный',
  occupied: 'Занят',
  assigned: 'Назначен',
  on_maintenance: 'На обслуживании',
};

const RoomStatusChartCard: React.FC<RoomStatusChartCardProps> = ({ roomStatuses }) => {
  const roomStatusEntries = Object.entries(roomStatuses).map(([status, count], index) => ({
    name: statusTranslation[status] || status,
    value: count,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card>
        <CardHeader>
            <CardTitle>Статусы номеров</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-full md:w-2/3 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={roomStatusEntries}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        label={false}
                        >
                        {roomStatusEntries.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        </Pie>
                        <Tooltip
                        content={({ active, payload }) =>
                            active && payload && payload.length ? (
                            <div className="p-2 rounded shadow text-sm">
                                <p className="font-semibold">{payload[0].payload.name}</p>
                                <p>Количество: {payload[0].value}</p>
                            </div>
                            ) : null
                        }
                        />
                    </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/3 space-y-2">
                    {roomStatusEntries.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm font-medium">{entry.name}</span>
                        <span className="ml-auto text-sm">{entry.value}</span>
                    </div>
                    ))}
                </div>
            </div>
        </CardContent>
    </Card>
  );
};

export default React.memo(RoomStatusChartCard); 