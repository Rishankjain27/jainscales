import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Scale, Search, Filter } from "lucide-react";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date")
  });

  const { data: serials = [] } = useQuery({
    queryKey: ["serials"],
    queryFn: () => base44.entities.SerialNumber.list()
  });

  const getProductStats = (productId) => {
    const productSerials = serials.filter(s => s.product_id === productId);
    const available = productSerials.filter(s => s.status === "Available").length;
    const sold = productSerials.filter(s => s.status === "Sold").length;
    return { total: productSerials.length, available, sold };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCapacity = capacityFilter === "all" || product.capacity === capacityFilter;
    const matchesBrand = brandFilter === "all" || product.brand === brandFilter;
    return matchesSearch && matchesCapacity && matchesBrand;
  });

  const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">Stock levels for all products</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={capacityFilter} onValueChange={setCapacityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by capacity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Capacities</SelectItem>
                <SelectItem value="10kg">10kg</SelectItem>
                <SelectItem value="20kg">20kg</SelectItem>
                <SelectItem value="30kg">30kg</SelectItem>
                <SelectItem value="40kg">40kg</SelectItem>
                <SelectItem value="50kg">50kg</SelectItem>
                <SelectItem value="60kg">60kg</SelectItem>
                <SelectItem value="80kg">80kg</SelectItem>
                <SelectItem value="100kg">100kg</SelectItem>
                <SelectItem value="200kg">200kg</SelectItem>
                <SelectItem value="300kg">300kg</SelectItem>
                <SelectItem value="500kg">500kg</SelectItem>
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {uniqueBrands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Scale className="w-5 h-5" />
            Inventory Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-center">Total Serials</TableHead>
                <TableHead className="text-center">Available</TableHead>
                <TableHead className="text-center">Sold</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stats = getProductStats(product.id);
                const isLowStock = stats.available < 5;
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell>{product.capacity}</TableCell>
                    <TableCell>{product.brand || "-"}</TableCell>
                    <TableCell>{product.model || "-"}</TableCell>
                    <TableCell className="text-center font-semibold">{stats.total}</TableCell>
                    <TableCell className="text-center">
                      <span className={isLowStock ? "text-orange-600 font-semibold" : "font-medium"}>
                        {stats.available}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-medium">{stats.sold}</TableCell>
                    <TableCell>
                      {isLowStock && stats.available > 0 ? (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          Low Stock
                        </Badge>
                      ) : stats.available === 0 ? (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          Out of Stock
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          In Stock
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    No products found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
