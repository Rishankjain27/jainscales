import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, Search, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function WarrantyTracking() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ warranty_start_date: "", warranty_end_date: "" });

  const queryClient = useQueryClient();

  const { data: serials = [], isLoading } = useQuery({
    queryKey: ["serials"],
    queryFn: () => base44.entities.SerialNumber.list()
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SerialNumber.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serials"] });
      toast.success("Warranty updated successfully");
      setEditing(null);
    }
  });

  const today = new Date();

  const warrantyItems = serials.filter(s => s.status === "Sold" || s.warranty_end_date);

  const filtered = warrantyItems.filter(s => {
    const q = search.toLowerCase();
    return (
      (s.serial_number || "").toLowerCase().includes(q) ||
      (s.customer_name || "").toLowerCase().includes(q)
    );
  });

  const getWarrantyStatus = (s) => {
    if (!s.warranty_end_date) return "N/A";
    return new Date(s.warranty_end_date) >= today ? "Active" : "Expired";
  };

  const openEdit = (s) => {
    setEditing(s);
    setEditForm({
      warranty_start_date: s.warranty_start_date || "",
      warranty_end_date: s.warranty_end_date || ""
    });
  };

  const handleSave = () => {
    const status = editForm.warranty_end_date
      ? (new Date(editForm.warranty_end_date) >= today ? "Active" : "Expired")
      : "N/A";
    updateMutation.mutate({
      id: editing.id,
      data: { ...editForm, warranty_status: status }
    });
  };

  const activeCount = filtered.filter(s => getWarrantyStatus(s) === "Active").length;
  const expiredCount = filtered.filter(s => getWarrantyStatus(s) === "Expired").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Warranty Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">Track and manage product warranties</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-teal-600">Active</p>
          <p className="text-2xl font-bold text-teal-700">{activeCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-red-500">Expired</p>
          <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
        </CardContent></Card>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search by serial number or customer name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5" />
            Warranty Records ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Serial No.</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Sale Date</TableHead>
                <TableHead>Warranty End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">No warranty records found</TableCell></TableRow>
              ) : filtered.map(s => {
                const wStatus = getWarrantyStatus(s);
                return (
                  <TableRow key={s.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono font-semibold text-blue-700">{s.serial_number}</TableCell>
                    <TableCell>{s.brand || "-"}</TableCell>
                    <TableCell>{s.model || "-"}</TableCell>
                    <TableCell>{s.customer_name || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {s.sale_date ? format(new Date(s.sale_date), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {s.warranty_end_date ? format(new Date(s.warranty_end_date), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        wStatus === "Active" ? "bg-teal-100 text-teal-700 border-teal-200" :
                        wStatus === "Expired" ? "bg-red-100 text-red-700 border-red-200" :
                        "bg-gray-100 text-gray-600"
                      }>
                        {wStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit Warranty — {editing.serial_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Warranty Start Date</Label>
                <Input type="date" value={editForm.warranty_start_date} onChange={e => setEditForm(f => ({ ...f, warranty_start_date: e.target.value }))} />
              </div>
              <div>
                <Label>Warranty End Date</Label>
                <Input type="date" value={editForm.warranty_end_date} onChange={e => setEditForm(f => ({ ...f, warranty_end_date: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
