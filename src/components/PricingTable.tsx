"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useMemo } from "react";
import type { VapiCall } from "@/lib/vapi";
import { calcCost, calcBlocks, formatDuration } from "@/lib/pricing";
import { format, parseISO } from "date-fns";
import { ArrowUpDown } from "lucide-react";

interface Props {
  calls: VapiCall[];
}

export function PricingTable({ calls }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "calcCost", desc: true },
  ]);

  const columns: ColumnDef<VapiCall>[] = useMemo(
    () => [
      {
        id: "customer",
        header: "Customer",
        accessorFn: (r) => r.customer?.name ?? r.customer?.number ?? "Unknown",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue<string>()}</span>
        ),
      },
      {
        id: "date",
        header: "Date",
        accessorFn: (r) => r.createdAt,
        cell: ({ getValue }) => {
          try {
            return (
              <span className="text-sm text-gray-500">
                {format(parseISO(getValue<string>()), "MMM d")}
              </span>
            );
          } catch {
            return "—";
          }
        },
      },
      {
        id: "duration",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Duration <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        accessorFn: (r) => r.durationSeconds ?? 0,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{formatDuration(getValue<number>())}</span>
        ),
      },
      {
        id: "blocks",
        header: "15s Blocks",
        accessorFn: (r) => calcBlocks(r.durationSeconds ?? 0),
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-gray-600">
            {getValue<number>()} × 15s
          </span>
        ),
      },
      {
        id: "calcCost",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Calc. Revenue <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        accessorFn: (r) => calcCost(r.durationSeconds ?? 0),
        cell: ({ getValue }) => (
          <span className="font-mono font-semibold text-green-700">
            ${getValue<number>().toFixed(2)}
          </span>
        ),
      },
      {
        id: "vapiCost",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            VAPI Cost <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        accessorFn: (r) => r.cost ?? 0,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-gray-600">
            ${getValue<number>().toFixed(3)}
          </span>
        ),
      },
      {
        id: "margin",
        header: "Gross Margin",
        accessorFn: (r) =>
          calcCost(r.durationSeconds ?? 0) - (r.cost ?? 0),
        cell: ({ getValue }) => {
          const m = getValue<number>();
          return (
            <span
              className={`font-mono text-sm font-semibold ${
                m >= 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {m >= 0 ? "+" : ""}${m.toFixed(2)}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: calls,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="bg-gray-50">
              {hg.headers.map((h) => (
                <TableHead key={h.id} className="text-xs py-2 px-3">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-2 px-3 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
