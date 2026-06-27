# MySpace Hub

> Một nền tảng Web App "Trang chủ trung tâm" (Hub Dashboard) với 3 ứng dụng tiện ích: **Monexa** (Quản lý chi tiêu), **Nixio** (Quản lý công việc) và **Notera** (Ghi chú cá nhân).

## Tính năng

- **Hub Dashboard** — Bảng điều khiển trung tâm với quick stats và navigation cards
- **Monexa** — Quản lý thu chi, phân loại danh mục, tổng hợp theo tháng
- **Nixio** — Kanban Board kéo thả task giữa 3 cột (To Do / In Progress / Done)
- **Notera** — Ghi chú cá nhân với tags, màu sắc, ghim

## Tech Stack

- **Frontend**: ReactJS + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State**: Zustand
- **Backend & DB**: Supabase (Auth + PostgreSQL)
- **Icons**: Lucide React
- **Charts**: Recharts

## Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/lethanhkha/MySpace.git
cd MySpace
```

### 2. Cài dependencies

```bash
npm install
```

### 3. Cấu hình Supabase

Tạo project tại [supabase.com](https://supabase.com), sau đó:

1. Vào **SQL Editor** trong dashboard Supabase, chạy file `schema.sql` (đã có sẵn trong repo)
2. Vào **Settings > API** lấy `URL` và `anon key`
3. Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Sửa nội dung file `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Chạy dev server

```bash
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`

## Cấu trúc dự án

```
MySpace/
├── src/
│   ├── components/
│   │   ├── common/         # Components chung (Modal, Spinner, ConfirmDialog...)
│   │   └── layout/         # AppLayout (header, navigation)
│   ├── pages/
│   │   ├── HubDashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── monexa/         # App quản lý chi tiêu
│   │   ├── nixio/          # App quản lý công việc
│   │   └── notera/         # App ghi chú
│   ├── stores/             # Zustand stores (auth, money, nixio, notera)
│   ├── lib/                # Supabase client, helpers
│   ├── App.jsx
│   └── main.jsx
├── schema.sql              # Database schema cho Supabase
└── package.json
```

## Database Schema

Xem chi tiết trong file [`schema.sql`](./schema.sql). Có 4 bảng:

- `profiles` — Thông tin user (mở rộng từ Supabase Auth)
- `monexa_expenses` — Giao dịch thu chi
- `nixio_tasks` — Công việc
- `notera_notes` — Ghi chú

Tất cả các bảng đều có Row Level Security (RLS) đảm bảo user chỉ truy cập được dữ liệu của mình.

## Scripts

- `npm run dev` — Chạy dev server
- `npm run build` — Build production
- `npm run preview` — Preview bản build

## Deploy

Có thể deploy lên **Vercel**, **Netlify** hoặc **Cloudflare Pages** một cách dễ dàng. Nhớ thêm 2 biến môi trường `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` vào settings deploy.

## License

MIT