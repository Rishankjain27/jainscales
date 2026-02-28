import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, FileText, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";

const displayCap = (cap) => {
  if (cap === null || cap === undefined || cap === "") return "-";
  const num = typeof cap === "number" ? cap : Number(String(cap).replace(/[^0-9]/g, ""));
  return isNaN(num) ? String(cap) : `${num} kg`;
};

function SortIcon({ col, sortConfig }) {
  if (sortConfig.column !== col) return <ChevronsUpDown className="w-3 h-3 ml-1 inline opacity-50" />;
  return sortConfig.direction === "asc"
    ? <ChevronUp className="w-3 h-3 ml-1 inline text-blue-600" />
    : <ChevronDown className="w-3 h-3 ml-1 inline text-blue-600" />;
}

function SortHead({ col, label, sortConfig, onSort, className = "" }) {
  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-gray-50 whitespace-nowrap ${className}`}
      onClick={() => onSort(col)}
    >
      {label}<SortIcon col={col} sortConfig={sortConfig} />
    </TableHead>
  );
}

export default function SerialTable({ serials, sortConfig, onSort, onEdit, onDelete, onGenerateBill, page, pageSize, onPageChange, onPageSizeChange }) {
  const totalPages = Math.ceil(serials.length / pageSize);
  const paginated = serials.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <SortHead col="serial_number" label="Serial No." sortConfig={sortConfig} onSort={onSort} />
              <TableHead>Brand</TableHead>
              <TableHead>Model</TableHead>
              <SortHead col="capacity" label="Capacity" sortConfig={sortConfig} onSort={onSort} />
              <SortHead col="selling_price" label="Price" sortConfig={sortConfig} onSort={onSort} />
              <TableHead>Status</TableHead>
              <TableHead>Customer</TableHead>
              <SortHead col="sale_date" label="Sale Date" sortConfig={sortConfig} onSort={onSort} />
              <TableHead>Warranty</TableHead>
              <TableHead>Bill</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(s => (
              <TableRow key={s.id} className="hover:bg-gray-50">
                <TableCell className="font-mono font-semibold text-blue-700">{s.serial_number}</TableCell>
                <TableCell>{s.brand || "-"}</TableCell>
                <TableCell>{s.model || "-"}</TableCell>
                <TableCell>{displayCap(s.capacity)}</TableCell>
                <TableCell>{s.selling_price != null ? `Rs.${Number(s.selling_price).toLocaleString()}` : "-"}</TableCell>
                <TableCell>
                  <Badge className={s.status === "Sold" ? "bg-red-100 text-red-700 border-red-200" : "bg-green-100 text-green-700 border-green-200"}>
                    {s.status === "Available" ? "In Stock" : (s.status || "In Stock")}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-28 truncate">{s.customer_name || "-"}</TableCell>
                <TableCell className="whitespace-nowrap">{s.sale_date ? format(new Date(s.sale_date), "dd/MM/yyyy") : "-"}</TableCell>
                <TableCell>
                  {s.warranty_end_date ? (
                    <Badge className={new Date(s.warranty_end_date) > new Date() ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}>
                      {new Date(s.warranty_end_date) > new Date() ? "Active" : "Expired"}
                    </Badge>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  {(s.status === "Sold" || s.status === "Available") && s.customer_name ? (
                    <Button variant="ghost" size="icon" onClick={() => onGenerateBill(s)} title="Generate Bill">
                      <FileText className="w-4 h-4 text-green-600" />
                    </Button>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(s)} title="Edit">
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(s.id)} title="Delete">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-gray-500 py-10">No records found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <Select value={String(pageSize)} onValueChange={v => { onPageSizeChange(Number(v)); onPageChange(1); }}>
            <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>per page &middot; <strong>{serials.length}</strong> total</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>← Prev</Button>
          <span className="text-sm px-2">Page {page} of {totalPages || 1}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next →</Button>
        </div>
      </div>
    </div>
  );
}
