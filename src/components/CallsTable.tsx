"use client";

import { useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VapiCall } from "@/lib/vapi";
import { getCallDuration, getCustomerName, getCustomerPhone } from "@/lib/vapi";
import { calcCost, formatDuration } from "@/lib/pricing";
import { format, parseISO } from "date-fns";
import { CallModal } from "./CallModal";
import { ArrowUpDown, Download, ExternalLink } from "lucide-react";

interface Props {
  calls: VapiCall[];
}

const DISPOSITION_COLORS: Record<string, string> = {
  CB: "bg-green-100 text-green-800 border-green-200",
  VM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  DNC: "bg-red-100 text-red-800 border-red-200",
  NQ: "bg-purple-100 text-purple-800 border-purple-200",
  Booked: "bg-blue-100 text-blue-800 border-blue-200",
  "NO ANSWER": "bg-gray-100 text-gray-600 border-gray-200",
};

function getDisp(call: VapiCall) {
  const d = call.analysis?.structuredData?.disposition;
  if (d) return d.toUpperCase();
  const r = (call.endedReason ?? "").toLowerCase();
  if (r.includes("voicemail") || r.includes("machine")) return "VM";
  if (r.includes("no-answer") || r.includes("busy")) return "NO ANSWER";
  if (r.includes("customer-ended") || r.includes("assistant-ended")) return "COMPLETED";
  return call.endedReason ?? "—";
}

export function CallsTable({ calls }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCall, setSelectedCall] = useState<VapiCall | null>(null);

  const columns: ColumnDef<VapiCall>[] = useMemo(
    () => [
      {
        id: "customer",
        header: "Customer",
        accessorFn: (r) => getCustomerName(r),
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">{getValue<string>()}</span>
        ),
      },
      {
        id: "phone",
        header: "Phone",
        accessorFn: (r) => getCustomerPhone(r),
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-500 font-mono">{getValue<string>()}</span>
        ),
      },
      {
        id: "createdAt",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 text-xs font-medium"
            onClick={() => column.toggleSorting()}
          >
            Date <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        accessorFn: (r) => r.createdAt,
        cell: ({ getValue }) => {
          try {
            return (
              <span className="text-sm text-gray-500">
                {format(parseISO(getValue<string>()), "MMM d, p")}
              </span>
            );
          } catch {
            return <span className="text-gray-400">—</span>;
          }
        },
        sortingFn: "datetime",
      },
      {
        id: "duration",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 text-xs font-medium"
            onClick={() => column.toggleSorting()}
          >
            Duration <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        accessorFn: (r) => getCallDuration(r),
        cell: ({ getValue }) => (
          <span className="text-sm font-mono">
            {formatDuration(getValue<number>())}
          </span>
        ),
      },
      {
        id: "disposition",
        header: "Disposition",
        accessorFn: (r) => getDisp(r),
        cell: ({ getValue }) => {
          const d = getValue<string>();
          const cls = DISPOSITION_COLORS[d] ?? "bg-gray-100 text-gray-600 border-gray-200";
          return (
            <Badge className={`text-xs border ${cls}`}>{d}</Badge>
          );
        },
      },
      {
        id: "booked",
        header: "Booked",
        accessorFn: (r) => r.analysis?.structuredData?.appointment_booked,
        cell: ({ getValue }) =>
          getValue() ? (
            <span className="text-green-600 font-semibold text-sm">✓</span>
          ) : (
            <span className="text-gray-300 text-sm">—</span>
          ),
      },
      {
        id: "cost",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 text-xs font-medium"
            onClick={() => column.toggleSorting()}
          >
            AI Cost <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        accessorFn: (r) => calcCost(getCallDuration(r)),
        cell: ({ getValue }) => (
          <span className="text-sm font-mono">
            ${getValue<number>().toFixed(2)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setSelectedCall(row.original)}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View
          </Button>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: calls,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  function exportCsv() {
    const rows = table.getFilteredRowModel().rows;
    const headers = ["Customer", "Phone", "Date", "Duration", "Disposition", "Booked", "AI Cost"];
    const lines = rows.map((r) => {
      const c = r.original;
      return [
        getCustomerName(c),
        getCustomerPhone(c),
        c.createdAt ? format(parseISO(c.createdAt), "yyyy-MM-dd HH:mm") : "",
        formatDuration(getCallDuration(c)),
        getDisp(c),
        c.analysis?.structuredData?.appointment_booked ? "Yes" : "No",
        `$${calcCost(getCallDuration(c)).toFixed(2)}`,
      ].join(",");
    });
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vapi-calls-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <Input
          placeholder="Search by name or number…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs h-8 text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={exportCsv}
          className="h-8 text-xs"
        >
          <Download className="w-3 h-3 mr-1" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-gray-50">
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="text-xs py-2 px-3">
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-gray-400 py-12 text-sm"
                >
                  No calls found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedCall(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2 px-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        {table.getFilteredRowModel().rows.length} of {calls.length} calls
      </p>

      <CallModal
        call={selectedCall}
        open={!!selectedCall}
        onClose={() => setSelectedCall(null)}
      />
    </>
  );
}
