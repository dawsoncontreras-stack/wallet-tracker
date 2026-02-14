# Wallet Production Tracker - Phase 1

A Next.js application for tracking wallet production and sewer performance with mock data.

## 🎯 Features Implemented (Phase 1)

### Sewer Interface
- View available orders to claim
- Claim orders and mark them as complete
- Track personal daily points
- See estimated completion time for pending orders

### Manager Interface
- **Performance Calendar**: Visual calendar showing daily points by sewer
- **Order Management**: Complete order table with filtering and actions
  - Reassign orders to different sewers
  - Mark orders complete/incomplete
  - Void orders
- **Sewer Metrics**: Performance leaderboard and analytics
  - Total points comparison
  - Orders completed
  - Average points per order

### Mock Data
- 4 wallet types with different point values (Georgetown: 2, Minimalist Badge: 2, Rio Grande: 5, Tyler: 3)
- 3 sewers + 1 manager user
- Sample orders in various states (pending, in progress, completed)
- Historical daily performance data

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Extract and navigate to the project**
   ```bash
   cd wallet-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open the app**
   Navigate to `http://localhost:3000` in your browser

### Mock Login Users

The app has 4 mock users you can log in as:

**Sewers:**
- Maria Garcia (maria@wallets.com)
- John Smith (john@wallets.com)
- Sarah Johnson (sarah@wallets.com)

**Manager:**
- Admin User (admin@wallets.com)

## 📁 Project Structure

```
wallet-tracker/
├── app/
│   ├── page.tsx              # Login page
│   ├── layout.tsx            # Root layout with AuthProvider
│   ├── globals.css           # Global styles
│   ├── sewer/
│   │   └── page.tsx          # Sewer dashboard
│   └── manager/
│       └── page.tsx          # Manager dashboard
├── components/
│   ├── sewer/
│   │   └── OrderCard.tsx     # Order display card
│   └── manager/
│       ├── PerformanceCalendar.tsx
│       ├── OrdersTable.tsx
│       └── SewerMetrics.tsx
├── lib/
│   ├── mockData.ts           # All mock data and types
│   └── auth.tsx              # Auth context (mock)
└── package.json
```

## 🎨 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Date Utilities**: date-fns

## 🔄 Phase 2 Planning (Database Integration)

To prepare for Phase 2, you'll need to:

1. **Set up Supabase**
   - Create a Supabase project
   - Set up database tables matching the mock data structure
   - Configure Row Level Security (RLS) policies

2. **Database Schema** (example):
   ```sql
   -- Users table (use Supabase Auth)
   -- auth.users handled by Supabase
   
   -- Profiles table
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users PRIMARY KEY,
     name TEXT,
     role TEXT CHECK (role IN ('sewer', 'manager'))
   );
   
   -- Wallet Types
   CREATE TABLE wallet_types (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     points INTEGER NOT NULL
   );
   
   -- Orders
   CREATE TABLE orders (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     order_number TEXT UNIQUE NOT NULL,
     wallet_type TEXT REFERENCES wallet_types(id),
     status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'void')),
     claimed_by UUID REFERENCES auth.users,
     claimed_at TIMESTAMPTZ,
     completed_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. **Replace Mock Auth**
   - Install `@supabase/supabase-js` and `@supabase/auth-helpers-nextjs`
   - Configure Google OAuth in Supabase dashboard
   - Update auth context to use real Supabase auth

4. **Replace Mock Data**
   - Replace useState with Supabase queries
   - Add real-time subscriptions for live updates
   - Implement server actions for mutations

## 🎯 Phase 3 Planning (Shopify Integration)

1. **Shopify Webhook Setup**
   - Create webhook endpoint in Next.js API routes
   - Configure webhook in Shopify admin
   - Parse order data and assign points based on wallet type

2. **Auto-scoring Logic**
   - Map Shopify product SKUs to wallet types
   - Calculate points automatically
   - Create orders in database when webhook received

## 💡 Key Features to Note

- **Responsive Design**: Works on mobile, tablet, and desktop
- **Real-time Updates**: Mock state management simulates real-time updates
- **Estimation Logic**: Calculates estimated completion time (15 min/point)
- **Performance Tracking**: Daily points visualization with calendar view
- **Flexible Timeframes**: 7, 14, or 30-day views for metrics

## 🐛 Development Notes

- All data is stored in component state (resets on refresh)
- Mock authentication doesn't persist across page reloads
- Date calculations use the browser's local timezone

## 📝 License

Private project - All rights reserved

## 🤝 Support

For questions or issues during development, refer to:
- Next.js docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Supabase docs: https://supabase.com/docs
