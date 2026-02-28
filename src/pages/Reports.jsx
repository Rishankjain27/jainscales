import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, Calendar, TrendingUp } from "lucide-react";
import { format, parseISO, isWithinInterval } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd")
  });

  const { data: serials = [] } = useQuery({
    queryKey: ["serials"],
    queryFn: () => base44.entities.SerialNumber.list()
  });

  const getSalesInRange = () => {
    return serials.filter(s => {
      const d = s.sale_date || s.date_sold;
      if (!d) return false;
      try {
        return isWithinInterval(parseISO(d), { start: parseISO(dateRange.start), end: parseISO(dateRange.end) });
      } catch { return false; }
    });
  };

  const exportSalesReport = () => {
    const data = getSalesInRange().map(s => ({
      "Brand": s.brand || "",
      "Model": s.model || "",
      "Capacity (kg)": s.capacity != null ? Number(s.capacity) : "",
      "Serial Number": s.serial_number,
      "Selling Price": s.selling_price != null ? Number(s.selling_price) : "",
      "Customer Name": s.customer_name || "",
      "Customer Mobile": s.customer_mobile || "",
      "Sale Date": s.sale_date || s.date_sold || "",
      "Warranty End": s.warranty_end_date || "",
      "Bill Book No": s.bill_book_number || "",
      "Bill No": s.bill_number || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, `Sales_${dateRange.start}_to_${dateRange.end}.xlsx`);
    toast.success("Sales report exported!");
  };

  const exportWarrantyReport = () => {
    const today = new Date();
    const data = serials.filter(s => s.warranty_end_date).map(s => ({
      "Serial Number": s.serial_number,
      "Brand": s.brand || "",
      "Model": s.model || "",
      "Customer Name": s.customer_name || "",
      "Customer Mobile": s.customer_mobile || "",
      "Warranty Start": s.warranty_start_date || "",
      "Warranty End": s.warranty_end_date || "",
      "Status": s.warranty_end_date && new Date(s.warranty_end_date) >= today ? "Active" : "Expired",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Warranties");
    XLSX.writeFile(wb, `Warranty_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Warranty report exported!");
  };

  const exportAllSerials = () => {
    const data = serials.map(s => ({
      "Brand": s.brand || "",
      "Model": s.model || "",
      "Capacity (kg)": s.capacity != null ? Number(s.capacity) : "",
      "Serial Number": s.serial_number,
      "Selling Price": s.selling_price != null ? Number(s.selling_price) : "",
      "Status": s.status === "Available" ? "In Stock" : (s.status || "In Stock"),
      "Customer Name": s.customer_name || "",
      "Customer Mobile": s.customer_mobile || "",
      "Sale Date": s.sale_date || "",
      "Warranty End": s.warranty_end_date || "",
      "Bill Book No": s.bill_book_number || "",
      "Bill No": s.bill_number || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Serials");
    XLSX.writeFile(wb, `All_Serials_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("All serial data exported!");
  };

  const salesInRange = getSalesInRange();
  const totalRevenue = salesInRange.reduce((sum, s) => sum + (Number(s.selling_price) || 0), 0);

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Export your data to Excel</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            Sales Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Start Date</Label>
              <Input type="date" value={dateRange.start} onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))} />
            </div>
            <div><Label>End Date</Label>
              <Input type="date" value={dateRange.end} onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
            <div><p className="text-sm text-blue-600 font-medium">Total Sales</p><p className="text-2xl font-bold text-blue-900">{salesInRange.length}</p></div>
            <div><p className="text-sm text-blue-600 font-medium">Total Revenue</p><p className="text-2xl font-bold text-blue-900">Rs.{totalRevenue.toLocaleString()}</p></div>
          </div>
          <Button onClick={exportSalesReport} className="bg-blue-600 hover:bg-blue-700 w-full">
            <FileDown className="w-4 h-4 mr-2" />Export Sales Report (Excel)
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Calendar className="w-5 h-5" />Warranty Report</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4 text-sm">Export all warranty data with status (Active/Expired).</p>
            <Button onClick={exportWarrantyReport} variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
              <FileDown className="w-4 h-4 mr-2" />Export Warranty Report
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><FileDown className="w-5 h-5" />All Serial Data</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4 text-sm">Export all serial numbers with complete details including customer info.</p>
            <Button onClick={exportAllSerials} variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-50">
              <FileDown className="w-4 h-4 mr-2" />Export All Serial Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
