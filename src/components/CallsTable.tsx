"use client";

import { useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
import type { VapiCall } from "@/lib/vapi";
import { getCallDuration, getCustomerName, getCustomerPhone, getDispositionKey } from "@/lib/vapi";
import { calcCost, formatDuration } from "@/lib/pricing";
import { format, parseISO } from "date-fns";
import { CallDetailDrawer } from "./CallDetailDrawer";
import { CallDispositionChip } from "./DispositionChip";
import { ChevronRight, Download, ChevronLeft, Search } from "lucide-react";

interface Props {
  calls: VapiCall[];
}

const ALL_DISP_KEYS = ["BOOKED", "CB", "VM", "DNC", "NQ", "NO_ANSWER", "COMPLETED", "OTHER"] as const;

const PAGE_SIZE = 25;

export function CallsTable({ calls }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [search, setSearch] = useState("");
  const [dispFilter, setDispFilter] = useState<string>("ALL");
  const [bookedOnly, setBookedOnly] = useState(false);
  const [selectedCall, setSelectedCall] = useState<VapiCall | null>(null);
  const [page, setPage] = useState(0);

  // Disposition counts
  const dispCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of calls) {
      const k = getDispositionKey(c);
      m[k] = (m[k] ?? 0) + 1;
    }
    return m;
  }, [calls]);

  // Keys that actually appear in data
  const activeKeys = ALL_DISP_KEYS.filter((k) => (dispCounts[k] ?? 0) > 0);

  // Filtered data (pre-table)
  const filteredCalls = useMemo(() => {
    let list = calls;
    if (dispFilter !== "ALL") list = list.filter((c) => getDispositionKey(c) === dispFilter);
    if (bookedOnly) list = list.filter((c) => c.analysis?.structuredData?.appointment_booked === true);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => {
        const name = getCustomerName(c).toLowerCase();
        const phone = getCustomerPhone(c).toLowerCase();
        return name.includes(q) || phone.includes(q);
      });
    }
    return list;
  }, [calls, dispFilter, bookedOnly, search]);

  const columns: ColumnDef<VapiCall>[] = useMemo(
    () => [
      {
        id: "customer",
        header: "Customer",
        accessorFn: (r) => getCustomerName(r),
        cell: ({ row }) => {
          const name = getCustomerName(row.original);
          const phone = getCustomerPhone(row.original);
          const initials = name.replace("Web Call", "WC").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
          return (
            <div className="flex items-center gap-2">
              <div
                className="shrink-0 flex items-center justify-center rounded-full font-semibold"
                style={{
                  width: 28,
                  height: 28,
                  background: "var(--accent-soft-2)",
                  color: "var(--accent-deep)",
                  fontSize: 10,
                }}
              >
                {initials || "?"}
              </div>
              <div>
                <p className="font-medium leading-tight" style={{ fontSize: 13, color: "var(--text-1)" }}>
                  {name}
                </p>
                {phone !== "—" && (
                  <p className="font-mono leading-tight" style={{ fontSize: 11, color: "var(--text-4)" }}>
                    {phone}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "disposition",
        header: "Outcome",
        accessorFn: (r) => getDispositionKey(r),
        cell: ({ row }) => <CallDispositionChip call={row.original} />,
      },
      {
        id: "createdAt",
        header: "Date",
        accessorFn: (r) => r.createdAt,
        cell: ({ getValue }) => {
          try {
            const d = parseISO(getValue<string>());
            return (
              <div>
                <p style={{ fontSize: 12, color: "var(--text-1)" }}>{format(d, "MMM d, yyyy")}</p>
                <p className="font-mono" style={{ fontSize: 11, color: "var(--text-4)" }}>{format(d, "p")}</p>
              </div>
            );
          } catch {
            return <span style={{ color: "var(--text-4)" }}>—</span>;
          }
        },
        sortingFn: "datetime",
      },
      {
        id: "duration",
        header: "Duration",
        accessorFn: (r) => getCallDuration(r),
        cell: ({ getValue }) => (
          <span className="font-mono" style={{ fontSize: 12, color: "var(--text-2)" }}>
            {formatDuration(getValue<number>())}
          </span>
        ),
      },
      {
        id: "cost",
        header: "AI Cost",
        accessorFn: (r) => calcCost(getCallDuration(r)),
        cell: ({ getValue }) => (
          <span className="font-mono" style={{ fontSize: 12, color: "var(--text-2)" }}>
            ${getValue<number>().toFixed(3)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: () => (
          <span style={{ color: "var(--text-4)" }}>
            <ChevronRight size={16} />
          </span>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredCalls,
    columns,
    state: { sorting, pagination: { pageIndex: page, pageSize: PAGE_SIZE } },
    onSortingChange: (s) => { setSorting(s); setPage(0); },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  const totalPages = Math.ceil(filteredCalls.length / PAGE_SIZE);
  const showing = table.getRowModel().rows.length;
  const total = filteredCalls.length;
  const from = page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

  function exportCsv() {
    const rows = filteredCalls;
    const headers = ["Customer", "Phone", "Date", "Duration", "Disposition", "Booked", "AI Cost"];
    const lines = rows.map((c) => [
      getCustomerName(c),
      getCustomerPhone(c),
      c.createdAt ? format(parseISO(c.createdAt), "yyyy-MM-dd HH:mm") : "",
      formatDuration(getCallDuration(c)),
      getDispositionKey(c),
      c.analysis?.structuredData?.appointment_booked ? "Yes" : "No",
      `$${calcCost(getCallDuration(c)).toFixed(3)}`,
    ].join(","));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `calls-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  }

  function PillBtn({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) {
    return (
      <button
        onClick={onClick}
        className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
        style={{
          background: active ? "var(--accent)" : "var(--surface-2)",
          color: active ? "#fff" : "var(--text-2)",
          border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <>
      {/* ── Filter bar ── */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Row 1: search + export */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 flex-1"
            style={{
              maxWidth: 320,
              height: 36,
              borderRadius: "var(--g-radius-pill)",
              border: "1px solid var(--line)",
              background: "var(--surface)",
            }}
          >
            <Search size={14} style={{ color: "var(--text-4)" }} />
            <input
              placeholder="Search by name or number…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: 13, color: "var(--text-1)" }}
            />
          </div>
          <div className="flex-1" />
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
            style={{
              border: "1px solid var(--line)",
              background: "var(--surface)",
              color: "var(--text-2)",
            }}
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>

        {/* Row 2: disposition pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <PillBtn active={dispFilter === "ALL"} onClick={() => { setDispFilter("ALL"); setPage(0); }}>
            ALL {calls.length}
          </PillBtn>
          {activeKeys.map((k) => (
            <PillBtn key={k} active={dispFilter === k} onClick={() => { setDispFilter(k); setPage(0); }}>
              {k} {dispCounts[k]}
            </PillBtn>
          ))}
          <div style={{ width: 1, height: 20, background: "var(--line)", margin: "0 4px" }} />
          <PillBtn active={bookedOnly} onClick={() => { setBookedOnly((b) => !b); setPage(0); }}>
            Booked only
          </PillBtn>
        </div>
      </div>

      {/* ── Table ── */}
      <div
        className="overflow-hidden"
        style={{ border: "1px solid var(--line)", borderRadius: "var(--g-radius-md)" }}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}
              >
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className="font-semibold uppercase tracking-wider"
                    style={{
                      fontSize: 11,
                      color: "var(--text-3)",
                      letterSpacing: "0.06em",
                      padding: "10px 14px",
                    }}
                  >
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
                  className="text-center py-16"
                  style={{ color: "var(--text-4)", fontSize: 13 }}
                >
                  No calls found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => setSelectedCall(row.original)}
                  style={{
                    height: "var(--row-h)",
                    borderBottom: "1px solid var(--line-soft)",
                    cursor: "pointer",
                    transition: "background 0.08s",
                  }}
                  className="hover:bg-[var(--surface-2)]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ padding: "0 14px" }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Footer / Pagination ── */}
      <div className="flex items-center justify-between mt-3">
        <p style={{ fontSize: 12, color: "var(--text-4)" }}>
          {total === 0 ? "No calls" : `Showing ${from}–${to} of ${total}`}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-opacity disabled:opacity-30"
              style={{ border: "1px solid var(--line)", background: "var(--surface)", color: "var(--text-2)" }}
            >
              <ChevronLeft size={13} />
              Prev
            </button>
            <span
              className="px-3 py-1 rounded-lg font-mono"
              style={{ fontSize: 12, color: "var(--text-2)", background: "var(--surface-2)", border: "1px solid var(--line)" }}
            >
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-opacity disabled:opacity-30"
              style={{ border: "1px solid var(--line)", background: "var(--surface)", color: "var(--text-2)" }}
            >
              Next
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      <CallDetailDrawer
        call={selectedCall}
        open={!!selectedCall}
        onClose={() => setSelectedCall(null)}
      />
    </>
  );
}
