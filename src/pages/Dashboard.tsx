import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    totalStockValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total products
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Fetch low stock items
      const { data: products } = await supabase
        .from("products")
        .select("current_stock, reorder_level, cost_price");

      const lowStock = products?.filter(
        (p) => p.current_stock <= p.reorder_level
      ).length || 0;

      const totalValue = products?.reduce(
        (sum, p) => sum + (p.current_stock * (p.cost_price || 0)),
        0
      ) || 0;

      // Fetch pending receipts
      const { count: receiptsCount } = await supabase
        .from("receipts")
        .select("*", { count: "exact", head: true })
        .in("status", ["draft", "waiting"]);

      // Fetch pending deliveries
      const { count: deliveriesCount } = await supabase
        .from("deliveries")
        .select("*", { count: "exact", head: true })
        .in("status", ["draft", "waiting"]);

      setStats({
        totalProducts: productsCount || 0,
        lowStockItems: lowStock,
        pendingReceipts: receiptsCount || 0,
        pendingDeliveries: deliveriesCount || 0,
        totalStockValue: totalValue,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    description,
    color = "primary",
  }: {
    title: string;
    value: string | number;
    icon: any;
    description?: string;
    color?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg bg-${color}/10`}>
          <Icon className={`h-4 w-4 text-${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your inventory operations
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={Package}
            description="Active products in inventory"
          />
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon={AlertTriangle}
            description="Products below reorder level"
            color="warning"
          />
          <StatCard
            title="Pending Receipts"
            value={stats.pendingReceipts}
            icon={ArrowDownToLine}
            description="Incoming stock awaiting receipt"
            color="accent"
          />
          <StatCard
            title="Pending Deliveries"
            value={stats.pendingDeliveries}
            icon={ArrowUpFromLine}
            description="Outgoing stock awaiting delivery"
            color="accent"
          />
          <StatCard
            title="Total Stock Value"
            value={`$${stats.totalStockValue.toFixed(2)}`}
            icon={TrendingUp}
            description="Total inventory value at cost"
            color="success"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <a
                href="/products"
                className="flex items-center p-4 border rounded-lg hover:bg-muted transition-colors"
              >
                <Package className="h-8 w-8 text-primary mr-4" />
                <div>
                  <h3 className="font-semibold">Manage Products</h3>
                  <p className="text-sm text-muted-foreground">Add or edit products</p>
                </div>
              </a>
              <a
                href="/receipts"
                className="flex items-center p-4 border rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowDownToLine className="h-8 w-8 text-primary mr-4" />
                <div>
                  <h3 className="font-semibold">New Receipt</h3>
                  <p className="text-sm text-muted-foreground">Receive incoming stock</p>
                </div>
              </a>
              <a
                href="/deliveries"
                className="flex items-center p-4 border rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowUpFromLine className="h-8 w-8 text-primary mr-4" />
                <div>
                  <h3 className="font-semibold">New Delivery</h3>
                  <p className="text-sm text-muted-foreground">Create delivery order</p>
                </div>
              </a>
              <a
                href="/warehouses"
                className="flex items-center p-4 border rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowUpFromLine className="h-8 w-8 text-primary mr-4" />
                <div>
                  <h3 className="font-semibold">Warehouses</h3>
                  <p className="text-sm text-muted-foreground">Manage locations</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
