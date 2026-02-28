import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingCart, ShieldCheck, ShieldAlert, TrendingUp } from "lucide-react";

function StatCard({ title, value, icon: Icon, color, sub }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: serials = [] } = useQuery({
    queryKey: ["serials"],
    queryFn: () => base44.entities.SerialNumber.list()
  });

  const today = new Date();

  const totalStock = serials.filter(s => s.status === "In Stock" || s.status === "Available").length;
  const totalSold = serials.filter(s => s.status === "Sold").length;
  const activeWarranty = serials.filter(s => s.warranty_end_date && new Date(s.warranty_end_date) >= today).length;
  const expiredWarranty = serials.filter(s => s.warranty_end_date && new Date(s.warranty_end_date) < today).length;
  const totalSalesValue = serials
    .filter(s => s.status === "Sold")
    .reduce((sum, s) => sum + (Number(s.selling_price) || 0), 0);

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">Overview of Jain Scales inventory & warranty</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total In Stock" value={totalStock} icon={Package} color="bg-blue-600" />
        <StatCard title="Total Sold" value={totalSold} icon={ShoppingCart} color="bg-purple-600" />
        <StatCard
          title="Total Sales Value"
          value={`Rs.${totalSalesValue.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-green-600"
        />
        <StatCard title="Active Warranty" value={activeWarranty} icon={ShieldCheck} color="bg-teal-500" />
        <StatCard title="Expired Warranty" value={expiredWarranty} icon={ShieldAlert} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Stock Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Total Items</span>
                <span className="font-semibold">{serials.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-green-600 font-medium">In Stock</span>
                <span className="font-semibold text-green-700">{totalStock}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-red-600 font-medium">Sold</span>
                <span className="font-semibold text-red-700">{totalSold}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Warranty Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Total Sold Items</span>
                <span className="font-semibold">{totalSold}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-teal-600 font-medium">Active Warranty</span>
                <span className="font-semibold text-teal-700">{activeWarranty}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-red-600 font-medium">Expired Warranty</span>
                <span className="font-semibold text-red-700">{expiredWarranty}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
