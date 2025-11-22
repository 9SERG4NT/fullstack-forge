import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface DeliveryLine {
  product_id: string;
  quantity: number;
  unit_price: number;
}

interface DeliveryDialogProps {
  open: boolean;
  onClose: () => void;
}

const DeliveryDialog = ({ open, onClose }: DeliveryDialogProps) => {
  const [reference, setReference] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [lines, setLines] = useState<DeliveryLine[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProducts();
      fetchWarehouses();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setReference("");
    setCustomerName("");
    setWarehouseId("");
    setNotes("");
    setDeliveryDate(new Date().toISOString().split("T")[0]);
    setLines([]);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, sku, current_stock")
      .eq("is_active", true)
      .order("name");
    setProducts(data || []);
  };

  const fetchWarehouses = async () => {
    const { data } = await supabase
      .from("warehouses")
      .select("id, name, code")
      .eq("is_active", true)
      .order("name");
    setWarehouses(data || []);
  };

  const addLine = () => {
    setLines([...lines, { product_id: "", quantity: 1, unit_price: 0 }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof DeliveryLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const handleSave = async () => {
    if (!reference || !customerName || !warehouseId || lines.length === 0) {
      toast.error("Please fill in all required fields and add at least one product");
      return;
    }

    const invalidLines = lines.some(l => !l.product_id || l.quantity <= 0);
    if (invalidLines) {
      toast.error("Please complete all product lines");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create delivery
      const { data: delivery, error: deliveryError } = await supabase
        .from("deliveries")
        .insert({
          reference,
          customer_name: customerName,
          warehouse_id: warehouseId,
          notes: notes || null,
          delivery_date: deliveryDate,
          status: "draft",
          created_by: user.id,
        })
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      // Create delivery lines
      const { error: linesError } = await supabase
        .from("delivery_lines")
        .insert(
          lines.map(line => ({
            delivery_id: delivery.id,
            product_id: line.product_id,
            quantity: line.quantity,
            unit_price: line.unit_price,
          }))
        );

      if (linesError) throw linesError;

      toast.success("Delivery created successfully");
      onClose();
    } catch (error: any) {
      console.error("Error saving delivery:", error);
      toast.error(error.message || "Failed to save delivery");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Delivery</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Reference *</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="DEL-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Customer Name *</Label>
              <Input
                id="customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Corp."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse *</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Delivery Date</Label>
              <Input
                id="date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Products *</Label>
              <Button type="button" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-32">Quantity</TableHead>
                    <TableHead className="w-32">Unit Price</TableHead>
                    <TableHead className="w-32">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                        No products added. Click "Add Product" to start.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line, index) => {
                      const product = products.find(p => p.id === line.product_id);
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={line.product_id}
                              onValueChange={(value) => updateLine(index, "product_id", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.sku} - {p.name} (Stock: {p.current_stock})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              max={product?.current_stock || 999999}
                              value={line.quantity}
                              onChange={(e) => updateLine(index, "quantity", parseInt(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unit_price}
                              onChange={(e) => updateLine(index, "unit_price", parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            ${(line.quantity * line.unit_price).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLine(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Create Delivery"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryDialog;
