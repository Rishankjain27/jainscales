import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, icon: Icon, color, trend }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs md:text-sm text-gray-600 font-medium">{title}</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">{value}</p>
            {trend && (
              <p className="text-xs text-gray-500 mt-1">{trend}</p>
            )}
          </div>
          <div className={cn("p-2 md:p-3 rounded-xl", color)}>
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
