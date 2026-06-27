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
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notera_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nixio_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE monexa_expenses ENABLE ROW LEVEL SECURITY;

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

-- Monexa: user chỉ truy cập expenses của mình
DROP POLICY IF EXISTS "Users can CRUD own expenses" ON monexa_expenses;
CREATE POLICY "Users can CRUD own expenses" ON monexa_expenses
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