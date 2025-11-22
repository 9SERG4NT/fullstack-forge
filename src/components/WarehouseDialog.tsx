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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  is_active: boolean;
}

interface WarehouseDialogProps {
  open: boolean;
  onClose: () => void;
  warehouse?: Warehouse;
}

const WarehouseDialog = ({ open, onClose, warehouse }: WarehouseDialogProps) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (warehouse) {
      setCode(warehouse.code);
      setName(warehouse.name);
      setAddress(warehouse.address || "");
      setIsActive(warehouse.is_active);
    } else {
      setCode("");
      setName("");
      setAddress("");
      setIsActive(true);
    }
  }, [warehouse, open]);

  const handleSave = async () => {
    if (!code || !name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const warehouseData = {
        code,
        name,
        address: address || null,
        is_active: isActive,
        created_by: user.id,
      };

      if (warehouse) {
        const { error } = await supabase
          .from("warehouses")
          .update(warehouseData)
          .eq("id", warehouse.id);

        if (error) throw error;
        toast.success("Warehouse updated successfully");
      } else {
        const { error } = await supabase
          .from("warehouses")
          .insert(warehouseData);

        if (error) throw error;
        toast.success("Warehouse created successfully");
      }

      onClose();
    } catch (error: any) {
      console.error("Error saving warehouse:", error);
      toast.error(error.message || "Failed to save warehouse");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {warehouse ? "Edit Warehouse" : "Add New Warehouse"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Warehouse Code *</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="WH001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Warehouse Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Warehouse"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Storage St, City, Country"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WarehouseDialog;
