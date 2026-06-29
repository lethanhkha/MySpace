-- ============================================
-- MySpace Hub Database Schema (Supabase)
-- ============================================

-- 1. Bảng profiles (mở rộng từ Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Bảng notera_notes
CREATE TABLE IF NOT EXISTS notera_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Ghi chú mới',
  content TEXT DEFAULT '',
  is_pinned BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#fef3c7',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notera_notes_user_id ON notera_notes(user_id);

-- 3. Bảng nixio_tasks
CREATE TABLE IF NOT EXISTS nixio_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nixio_tasks_user_id ON nixio_tasks(user_id);

-- 4. Bảng monexa_expenses
CREATE TABLE IF NOT EXISTS monexa_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT DEFAULT 'chi_tieu' CHECK (type IN ('thu_nhap','chi_tieu')),
  category TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monexa_expenses_user_id ON monexa_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_monexa_expenses_date ON monexa_expenses(date);

-- ============================================
-- Monexa: Wallets, Budgets, Savings Goals
-- ============================================

-- 5. Bảng ví tiền (monexa_wallets)
CREATE TABLE IF NOT EXISTS monexa_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'cash' CHECK (type IN ('cash','bank','card','ewallet','other')),
  balance DECIMAL(14,2) DEFAULT 0,
  color TEXT DEFAULT '#10b981',
  icon TEXT DEFAULT 'wallet',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_monexa_wallets_user_id ON monexa_wallets(user_id);

-- 6. Bảng ngân sách (monexa_budgets)
CREATE TABLE IF NOT EXISTS monexa_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  period TEXT DEFAULT 'monthly' CHECK (period IN ('monthly','weekly','yearly')),
  start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, period)
);
CREATE INDEX IF NOT EXISTS idx_monexa_budgets_user_id ON monexa_budgets(user_id);

-- 7. Bảng mục tiêu tiết kiệm (monexa_savings_goals)
CREATE TABLE IF NOT EXISTS monexa_savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(14,2) NOT NULL,
  current_amount DECIMAL(14,2) DEFAULT 0,
  deadline DATE,
  color TEXT DEFAULT '#10b981',
  icon TEXT DEFAULT 'piggy-bank',
  note TEXT DEFAULT '',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_monexa_savings_goals_user_id ON monexa_savings_goals(user_id);

-- ============================================
-- Nixio: Projects
-- ============================================

-- 8. Bảng project (nixio_projects)
CREATE TABLE IF NOT EXISTS nixio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'folder',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nixio_projects_user_id ON nixio_projects(user_id);

-- ============================================
-- Alter: thêm field mới vào bảng hiện tại
-- ============================================

ALTER TABLE nixio_tasks
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES nixio_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS start_date DATE;

CREATE INDEX IF NOT EXISTS idx_nixio_tasks_project_id ON nixio_tasks(project_id);

ALTER TABLE monexa_expenses
  ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES monexa_wallets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_monexa_expenses_wallet_id ON monexa_expenses(wallet_id);

ALTER TABLE notera_notes
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notera_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nixio_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE monexa_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monexa_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE monexa_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE monexa_savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE nixio_projects ENABLE ROW LEVEL SECURITY;

-- Profiles: user chỉ xem/sửa được profile của mình
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Notera: user chỉ truy cập notes của mình
DROP POLICY IF EXISTS "Users can CRUD own notes" ON notera_notes;
CREATE POLICY "Users can CRUD own notes" ON notera_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Nixio: user chỉ truy cập tasks của mình
DROP POLICY IF EXISTS "Users can CRUD own tasks" ON nixio_tasks;
CREATE POLICY "Users can CRUD own tasks" ON nixio_tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Monexa expenses
DROP POLICY IF EXISTS "Users can CRUD own expenses" ON monexa_expenses;
CREATE POLICY "Users can CRUD own expenses" ON monexa_expenses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Monexa wallets
DROP POLICY IF EXISTS "Users can CRUD own wallets" ON monexa_wallets;
CREATE POLICY "Users can CRUD own wallets" ON monexa_wallets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Monexa budgets
DROP POLICY IF EXISTS "Users can CRUD own budgets" ON monexa_budgets;
CREATE POLICY "Users can CRUD own budgets" ON monexa_budgets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Monexa savings goals
DROP POLICY IF EXISTS "Users can CRUD own savings_goals" ON monexa_savings_goals;
CREATE POLICY "Users can CRUD own savings_goals" ON monexa_savings_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Nixio projects
DROP POLICY IF EXISTS "Users can CRUD own projects" ON nixio_projects;
CREATE POLICY "Users can CRUD own projects" ON nixio_projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Auto update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notera_notes_updated_at ON notera_notes;
CREATE TRIGGER update_notera_notes_updated_at BEFORE UPDATE ON notera_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nixio_tasks_updated_at ON nixio_tasks;
CREATE TRIGGER update_nixio_tasks_updated_at BEFORE UPDATE ON nixio_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monexa_wallets_updated_at ON monexa_wallets;
CREATE TRIGGER update_monexa_wallets_updated_at BEFORE UPDATE ON monexa_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monexa_budgets_updated_at ON monexa_budgets;
CREATE TRIGGER update_monexa_budgets_updated_at BEFORE UPDATE ON monexa_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monexa_savings_goals_updated_at ON monexa_savings_goals;
CREATE TRIGGER update_monexa_savings_goals_updated_at BEFORE UPDATE ON monexa_savings_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nixio_projects_updated_at ON nixio_projects;
CREATE TRIGGER update_nixio_projects_updated_at BEFORE UPDATE ON nixio_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();