import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const CAPACITIES = [10, 20, 30, 50, 100, 300, 600, 1500, 2000];

export default function SerialFilters({ filters, onFiltersChange, brands }) {
  const set = (key, value) => onFiltersChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          className="pl-9 h-9"
          placeholder="Search serial or customer..."
          value={filters.search}
          onChange={e => set("search", e.target.value)}
        />
      </div>
      <Select value={filters.brand} onValueChange={v => set("brand", v)}>
        <SelectTrigger className="w-full sm:w-36 h-9 text-sm"><SelectValue placeholder="All Brands" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Brands</SelectItem>
          {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.capacity} onValueChange={v => set("capacity", v)}>
        <SelectTrigger className="w-full sm:w-40 h-9 text-sm"><SelectValue placeholder="All Capacities" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Capacities</SelectItem>
          {CAPACITIES.map(c => <SelectItem key={c} value={String(c)}>{c} kg</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.status} onValueChange={v => set("status", v)}>
        <SelectTrigger className="w-full sm:w-32 h-9 text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="In Stock">In Stock</SelectItem>
          <SelectItem value="Sold">Sold</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
