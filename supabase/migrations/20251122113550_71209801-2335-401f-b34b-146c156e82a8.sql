-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create warehouses table
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view warehouses"
  ON public.warehouses FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create warehouses"
  ON public.warehouses FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Create product categories table
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories"
  ON public.product_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create categories"
  ON public.product_categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.product_categories(id),
  unit_of_measure TEXT NOT NULL,
  reorder_level INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  cost_price DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products"
  ON public.products FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update products"
  ON public.products FOR UPDATE
  USING (auth.uid() = created_by);

-- Create receipts table (incoming stock)
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'waiting', 'ready', 'done', 'cancelled')),
  receipt_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view receipts"
  ON public.receipts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create receipts"
  ON public.receipts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update receipts"
  ON public.receipts FOR UPDATE
  USING (auth.uid() = created_by);

-- Create receipt lines table
CREATE TABLE public.receipt_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES public.receipts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.receipt_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view receipt lines"
  ON public.receipt_lines FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create receipt lines"
  ON public.receipt_lines FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create deliveries table (outgoing stock)
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'waiting', 'ready', 'done', 'cancelled')),
  delivery_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deliveries"
  ON public.deliveries FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create deliveries"
  ON public.deliveries FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update deliveries"
  ON public.deliveries FOR UPDATE
  USING (auth.uid() = created_by);

-- Create delivery lines table
CREATE TABLE public.delivery_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.delivery_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view delivery lines"
  ON public.delivery_lines FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create delivery lines"
  ON public.delivery_lines FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create stock movements table (for tracking all changes)
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  warehouse_id UUID REFERENCES public.warehouses(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('receipt', 'delivery', 'adjustment', 'transfer')),
  quantity INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stock movements"
  ON public.stock_movements FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create stock movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Function to update profile on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();