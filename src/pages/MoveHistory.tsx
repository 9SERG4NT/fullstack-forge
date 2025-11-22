import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MoveHistory = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Move History</h1>
          <p className="text-muted-foreground">Track all stock movements and transactions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stock Movement Ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Coming soon - complete stock movement history
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MoveHistory;
