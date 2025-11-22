import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Warehouses = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
            <p className="text-muted-foreground">Manage storage locations</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Warehouse List</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Coming soon - warehouse management functionality
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Warehouses;
