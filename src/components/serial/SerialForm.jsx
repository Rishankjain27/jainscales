import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { addYears, format } from "date-fns";

const CAPACITIES = [10, 20, 30, 50, 100, 300, 600, 1500, 2000];

const toCapStr = (cap) => {
  if (cap === null || cap === undefined || cap === "") return "";
  const num = typeof cap === "number" ? cap : Number(String(cap).replace(/[^0-9]/g, ""));
  return isNaN(num) ? "" : String(num);
};

const defaultForm = {
  brand: "", model: "", capacity: "", serial_number: "",
  purchase_date: "", selling_price: "", status: "In Stock",
  customer_name: "", customer_mobile: "", sale_date: "",
  bill_book_number: "", bill_number: "", warranty_start_date: "", warranty_end_date: "",
};

export default function SerialForm({ serial, onSubmit, onCancel, isLoading }) {
  const [form, setForm] = useState(defaultForm);
  const [selectedProduct, setSelectedProduct] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list()
  });

  useEffect(() => {
    if (serial) {
      setForm({
        brand: serial.brand || "",
        model: serial.model || "",
        capacity: toCapStr(serial.capacity),
        serial_number: serial.serial_number || "",
        purchase_date: serial.purchase_date || "",
        selling_price: serial.selling_price ?? "",
        status: serial.status === "Available" ? "In Stock" : (serial.status || "In Stock"),
        customer_name: serial.customer_name || "",
        customer_mobile: serial.customer_mobile || serial.customer_phone || "",
        sale_date: serial.sale_date || serial.date_sold || "",
        bill_book_number: serial.bill_book_number || "",
        bill_number: serial.bill_number || "",
        warranty_start_date: serial.warranty_start_date || "",
        warranty_end_date: serial.warranty_end_date || "",
      });
    } else {
      setForm(defaultForm);
      setSelectedProduct("");
    }
  }, [serial]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleProductSelect = (productId) => {
    setSelectedProduct(productId);
    if (productId === "manual") return;
    const product = products.find(p => p.id === productId);
    if (product) {
      setForm(f => ({
        ...f,
        brand: product.brand || "",
        model: product.model || "",
        capacity: toCapStr(product.capacity),
      }));
    }
  };

  const handleSaleDateChange = (date) => {
    set("sale_date", date);
    set("warranty_start_date", date);
    if (date) {
      try {
        const end = format(addYears(new Date(date), 1), "yyyy-MM-dd");
        set("warranty_end_date", end);
      } catch (e) {}
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      capacity: form.capacity ? Number(form.capacity) : null,
      selling_price: form.selling_price !== "" ? Number(form.selling_price) : null,
      warranty_status: form.status === "Sold" ? "Active" : "N/A",
    };
    onSubmit(data);
  };

  const selectedProductObj = products.find(p => p.id === selectedProduct);

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">{serial ? "Edit Serial" : "Add New Serial"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Product Quick Select */}
          {!serial && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Label className="text-blue-800 font-semibold mb-2 block">Select Product (Auto-fills details)</Label>
              <Select value={selectedProduct} onValueChange={handleProductSelect}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="— Choose a product to auto-fill Brand, Model, Capacity —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Enter manually</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.product_name}
                      {p.brand ? ` · ${p.brand}` : ""}
                      {p.model ? ` · ${p.model}` : ""}
                      {p.capacity ? ` · ${p.capacity} kg` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProductObj && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedProductObj.brand && <Badge className="bg-blue-100 text-blue-800">Brand: {selectedProductObj.brand}</Badge>}
                  {selectedProductObj.model && <Badge className="bg-purple-100 text-purple-800">Model: {selectedProductObj.model}</Badge>}
                  {selectedProductObj.capacity && <Badge className="bg-green-100 text-green-800">Capacity: {selectedProductObj.capacity} kg</Badge>}
                </div>
              )}
            </div>
          )}

          {/* Main Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><Label>Serial Number *</Label>
              <Input value={form.serial_number} onChange={e => set("serial_number", e.target.value)} placeholder="e.g. JS001" required className="font-mono" /></div>
            <div><Label>Brand</Label>
              <Input value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="e.g. Jain" /></div>
            <div><Label>Model</Label>
              <Input value={form.model} onChange={e => set("model", e.target.value)} placeholder="e.g. JS-100" /></div>
            <div><Label>Capacity (kg)</Label>
              <Select value={form.capacity} onValueChange={v => set("capacity", v)}>
                <SelectTrigger><SelectValue placeholder="Select capacity" /></SelectTrigger>
                <SelectContent>
                  {CAPACITIES.map(c => <SelectItem key={c} value={String(c)}>{c} kg</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Purchase Date</Label>
              <Input type="date" value={form.purchase_date} onChange={e => set("purchase_date", e.target.value)} /></div>
            <div><Label>Selling Price (Rs.)</Label>
              <Input type="number" value={form.selling_price} onChange={e => set("selling_price", e.target.value)} placeholder="0" /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Stock">In Stock</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.status === "Sold" && (
            <div className="border-t pt-4 mt-2">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Sale Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><Label>Customer Name *</Label>
                  <Input value={form.customer_name} onChange={e => set("customer_name", e.target.value)} placeholder="Customer name" required /></div>
                <div><Label>Customer Mobile *</Label>
                  <Input value={form.customer_mobile} onChange={e => set("customer_mobile", e.target.value)} placeholder="Mobile number" required /></div>
                <div><Label>Sale Date *</Label>
                  <Input type="date" value={form.sale_date} onChange={e => handleSaleDateChange(e.target.value)} required /></div>
                <div><Label>Bill Book Number *</Label>
                  <Input value={form.bill_book_number} onChange={e => set("bill_book_number", e.target.value)} placeholder="Bill book #" required /></div>
                <div><Label>Bill Number *</Label>
                  <Input value={form.bill_number} onChange={e => set("bill_number", e.target.value)} placeholder="Bill #" required /></div>
                <div><Label>Warranty Start</Label>
                  <Input type="date" value={form.warranty_start_date} onChange={e => set("warranty_start_date", e.target.value)} /></div>
                <div><Label>Warranty End (Editable)</Label>
                  <Input type="date" value={form.warranty_end_date} onChange={e => set("warranty_end_date", e.target.value)} /></div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Saving..." : (serial ? "Update Serial" : "Add Serial")}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
