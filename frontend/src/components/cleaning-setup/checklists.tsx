import { Checklist } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const getChecklistTemplateColumns = (
  handleEdit: (template: Checklist) => void,
  handleDeleteClick: (id: number, name: string) => void,
  isActionDisabled: (id: number) => boolean
): ColumnDef<Checklist>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Название <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'cleaning_type_name', // Предполагаем, что это поле приходит с бэкенда
    header: 'Тип уборки',
    cell: ({ row }) => row.original.cleaning_type_display || <span className="text-muted-foreground">N/A</span>,
  },
  {
    accessorKey: 'items',
    header: 'Кол-во пунктов',
    cell: ({ row }) => row.original.items?.length || 0,
  },
  {
    accessorKey: 'periodicity',
    header: 'Периодичность раз в дней',
    cell: ({ row }) => row.original.periodicity || 1,
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Действия</div>,
    cell: ({ row }) => {
      const template = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isActionDisabled(template.id)}>
                <span className="sr-only">Открыть меню</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Действия</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(template)}>
                <Edit className="mr-2 h-4 w-4" /> Редактировать
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(template.id, template.name)}
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];