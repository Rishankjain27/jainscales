import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { format } from "date-fns";
import SerialForm from "@/components/serial/SerialForm";
import SerialFilters from "@/components/serial/SerialFilters";
import SerialTable from "@/components/serial/SerialTable";
import BillGenerator from "@/components/billing/BillGenerator";

const SORT_OPTIONS = [
  { value: "default", label: "Default (In Stock → Capacity)" },
  { value: "serial_asc", label: "Serial Number (A → Z)" },
  { value: "serial_desc", label: "Serial Number (Z → A)" },
  { value: "capacity_asc", label: "Capacity (Low → High)" },
  { value: "capacity_desc", label: "Capacity (High → Low)" },
  { value: "price_asc", label: "Price (Low → High)" },
  { value: "price_desc", label: "Price (High → Low)" },
  { value: "sale_desc", label: "Sale Date (Newest First)" },
  { value: "sale_asc", label: "Sale Date (Oldest First)" },
  { value: "status_stock", label: "Status (In Stock First)" },
  { value: "status_sold", label: "Status (Sold First)" },
];

function naturalCompare(a, b) {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

function applySort(list, sortKey, sortConfig) {
  const sorted = [...list];

  // Column click sort overrides dropdown
  const col = sortConfig?.column;
  const dir = sortConfig?.direction;

  if (col) {
    sorted.sort((a, b) => {
      let va, vb;
      if (col === "serial_number") { va = a.serial_number || ""; vb = b.serial_number || ""; return dir === "asc" ? naturalCompare(va, vb) : naturalCompare(vb, va); }
      if (col === "capacity") { va = Number(a.capacity) || 0; vb = Number(b.capacity) || 0; return dir === "asc" ? va - vb : vb - va; }
      if (col === "selling_price") { va = Number(a.selling_price) || 0; vb = Number(b.selling_price) || 0; return dir === "asc" ? va - vb : vb - va; }
      if (col === "sale_date") { va = a.sale_date || ""; vb = b.sale_date || ""; return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va); }
      return 0;
    });
    return sorted;
  }

  // Dropdown sort
  switch (sortKey) {
    case "serial_asc": sorted.sort((a, b) => naturalCompare(a.serial_number, b.serial_number)); break;
    case "serial_desc": sorted.sort((a, b) => naturalCompare(b.serial_number, a.serial_number)); break;
    case "capacity_asc": sorted.sort((a, b) => (Number(a.capacity) || 0) - (Number(b.capacity) || 0)); break;
    case "capacity_desc": sorted.sort((a, b) => (Number(b.capacity) || 0) - (Number(a.capacity) || 0)); break;
    case "price_asc": sorted.sort((a, b) => (Number(a.selling_price) || 0) - (Number(b.selling_price) || 0)); break;
    case "price_desc": sorted.sort((a, b) => (Number(b.selling_price) || 0) - (Number(a.selling_price) || 0)); break;
    case "sale_desc": sorted.sort((a, b) => (b.sale_date || "").localeCompare(a.sale_date || "")); break;
    case "sale_asc": sorted.sort((a, b) => (a.sale_date || "").localeCompare(b.sale_date || "")); break;
    case "status_stock": sorted.sort((a, b) => (a.status === "Sold" ? 1 : -1) - (b.status === "Sold" ? 1 : -1)); break;
    case "status_sold": sorted.sort((a, b) => (a.status !== "Sold" ? 1 : -1) - (b.status !== "Sold" ? 1 : -1)); break;
    default:
      // In Stock first, then capacity asc
      sorted.sort((a, b) => {
        const aStock = a.status !== "Sold" ? 0 : 1;
        const bStock = b.status !== "Sold" ? 0 : 1;
        if (aStock !== bStock) return aStock - bStock;
        return (Number(a.capacity) || 0) - (Number(b.capacity) || 0);
      });
  }
  return sorted;
}

export default function SerialManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingSerial, setEditingSerial] = useState(null);
  const [billingSerial, setBillingSerial] = useState(null);
  const [filters, setFilters] = useState({ search: "", brand: "all", capacity: "all", status: "all" });
  const [sortKey, setSortKey] = useState("default");
  const [sortConfig, setSortConfig] = useState({ column: null, direction: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const queryClient = useQueryClient();

  const { data: serials = [], isLoading } = useQuery({
    queryKey: ["serials"],
    queryFn: () => base44.entities.SerialNumber.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SerialNumber.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["serials"] }); setShowForm(false); toast.success("Serial added!"); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SerialNumber.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["serials"] }); setShowForm(false); setEditingSerial(null); toast.success("Serial updated!"); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SerialNumber.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["serials"] }); toast.success("Deleted!"); }
  });

  const handleSubmit = (data) => {
    if (editingSerial) {
      updateMutation.mutate({ id: editingSerial.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (s) => { setEditingSerial(s); setShowForm(true); };
  const handleCancel = () => { setShowForm(false); setEditingSerial(null); };

  const handleSort = (col) => {
    setSortConfig(prev => {
      if (prev.column === col) return { column: col, direction: prev.direction === "asc" ? "desc" : "asc" };
      return { column: col, direction: "asc" };
    });
    setSortKey(""); // disable dropdown sort when column is clicked
    setPage(1);
  };

  const brands = useMemo(() => [...new Set(serials.map(s => s.brand).filter(Boolean))], [serials]);

  const normalizeStatus = (s) => {
    if (!s) return "In Stock";
    if (s === "Available") return "In Stock";
    return s;
  };

  const filtered = useMemo(() => {
    return serials.filter(s => {
      const serial = s.serial_number || "";
      const customer = s.customer_name || "";
      const q = filters.search.toLowerCase();
      const matchSearch = !q || serial.toLowerCase().includes(q) || customer.toLowerCase().includes(q);
      const matchBrand = filters.brand === "all" || s.brand === filters.brand;
      const cap = s.capacity != null ? String(Number(s.capacity)) : "";
      const matchCap = filters.capacity === "all" || cap === filters.capacity;
      const st = normalizeStatus(s.status);
      const matchStatus = filters.status === "all" || st === filters.status;
      return matchSearch && matchBrand && matchCap && matchStatus;
    });
  }, [serials, filters]);

  const sorted = useMemo(() => applySort(filtered, sortKey, sortConfig.column ? sortConfig : null), [filtered, sortKey, sortConfig]);

  const exportExcel = () => {
    const data = sorted.map(s => ({
      "Brand": s.brand || "",
      "Model": s.model || "",
      "Capacity (kg)": s.capacity != null ? Number(s.capacity) : "",
      "Serial Number": s.serial_number,
      "Selling Price": s.selling_price != null ? Number(s.selling_price) : "",
      "Status": normalizeStatus(s.status),
      "Customer Name": s.customer_name || "",
      "Customer Mobile": s.customer_mobile || "",
      "Sale Date": s.sale_date || "",
      "Warranty End Date": s.warranty_end_date || "",
      "Bill Book Number": s.bill_book_number || "",
      "Bill Number": s.bill_number || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Serials");
    XLSX.writeFile(wb, `Serial_Data_${format(new Date(), "yyyyMMdd")}.xlsx`);
    toast.success("Exported successfully!");
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Serial Management</h1>
          <p className="text-sm text-gray-500 mt-1">{serials.length} total records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportExcel} className="border-green-600 text-green-700 hover:bg-green-50">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={() => { setEditingSerial(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Serial
          </Button>
        </div>
      </div>

      {showForm && (
        <SerialForm
          serial={editingSerial}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <Card className="mb-4">
        <CardContent className="pt-4 pb-3 space-y-3">
          <SerialFilters filters={filters} onFiltersChange={(f) => { setFilters(f); setPage(1); }} brands={brands} />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">Sort By:</span>
            <Select value={sortKey} onValueChange={v => { setSortKey(v); setSortConfig({ column: null, direction: "asc" }); setPage(1); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 pt-2">
          <SerialTable
            serials={sorted}
            sortConfig={sortConfig}
            onSort={handleSort}
            onEdit={handleEdit}
            onDelete={(id) => { if (window.confirm("Delete this serial?")) deleteMutation.mutate(id); }}
            onGenerateBill={setBillingSerial}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {billingSerial && <BillGenerator serial={billingSerial} onClose={() => setBillingSerial(null)} />}
    </div>
  );
}
