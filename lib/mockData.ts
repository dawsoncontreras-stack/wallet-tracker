// Mock data for Phase 1

export type UserRole = 'sewer' | 'manager';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface WalletType {
  id: string;
  name: string;
  points: number;
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'void';

export interface Order {
  id: string;
  orderNumber: string;
  walletType: string;
  walletTypeName: string;
  points: number;
  status: OrderStatus;
  claimedBy?: string;
  claimedByName?: string;
  claimedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  ordererName?: string;
}

export interface DailyPoints {
  sewerId: string;
  sewerName: string;
  date: string;
  totalPoints: number;
  ordersCompleted: number;
}

// Mock wallet types
export const walletTypes: WalletType[] = [
  { id: 'georgetown', name: 'Georgetown', points: 2 },
  { id: 'minimalist-badge', name: 'Minimalist Badge Wallet', points: 2 },
  { id: 'rio-grande', name: 'Rio Grande', points: 5 },
  { id: 'tyler', name: 'Tyler', points: 3 },
];

// Mock users
export const users: User[] = [
  { id: 'user-1', email: 'maria@wallets.com', name: 'Maria Garcia', role: 'sewer' },
  { id: 'user-2', email: 'john@wallets.com', name: 'John Smith', role: 'sewer' },
  { id: 'user-3', email: 'sarah@wallets.com', name: 'Sarah Johnson', role: 'sewer' },
  { id: 'manager-1', email: 'admin@wallets.com', name: 'Admin User', role: 'manager' },
];

// Helper to generate mock orders
const generateMockOrders = (): Order[] => {
  const orders: Order[] = [];
  const now = new Date();
  
  // Pending orders
  orders.push(
    {
      id: 'order-1',
      orderNumber: '#1001',
      walletType: 'georgetown',
      walletTypeName: 'Georgetown',
      points: 2,
      status: 'pending',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      ordererName: 'John Anderson',
    },
    {
      id: 'order-2',
      orderNumber: '#1002',
      walletType: 'rio-grande',
      walletTypeName: 'Rio Grande',
      points: 5,
      status: 'pending',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      ordererName: 'Emily Chen',
    },
    {
      id: 'order-3',
      orderNumber: '#1003',
      walletType: 'tyler',
      walletTypeName: 'Tyler',
      points: 3,
      status: 'pending',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      ordererName: 'Michael Rodriguez',
    },
    {
      id: 'order-4',
      orderNumber: '#1004',
      walletType: 'minimalist-badge',
      walletTypeName: 'Minimalist Badge Wallet',
      points: 2,
      status: 'pending',
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      ordererName: 'Sarah Thompson',
    }
  );

  // In progress orders
  orders.push(
    {
      id: 'order-5',
      orderNumber: '#1005',
      walletType: 'georgetown',
      walletTypeName: 'Georgetown',
      points: 2,
      status: 'in_progress',
      claimedBy: 'user-1',
      claimedByName: 'Maria Garcia',
      claimedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      ordererName: 'David Wilson',
    },
    {
      id: 'order-6',
      orderNumber: '#1006',
      walletType: 'rio-grande',
      walletTypeName: 'Rio Grande',
      points: 5,
      status: 'in_progress',
      claimedBy: 'user-2',
      claimedByName: 'John Smith',
      claimedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      ordererName: 'Lisa Martinez',
    }
  );

  // Completed orders
  const completedDates = [
    new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Yesterday
    new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
  ];

  const customerNames = [
    'Robert Taylor', 'Jennifer Brown', 'William Davis', 
    'Amanda White', 'Christopher Lee', 'Michelle Garcia'
  ];

  completedDates.forEach((date, index) => {
    const walletType = walletTypes[index % walletTypes.length];
    const sewer = users.filter(u => u.role === 'sewer')[index % 3];
    
    orders.push({
      id: `order-completed-${index + 1}`,
      orderNumber: `#${2000 + index}`,
      walletType: walletType.id,
      walletTypeName: walletType.name,
      points: walletType.points,
      status: 'completed',
      claimedBy: sewer.id,
      claimedByName: sewer.name,
      claimedAt: new Date(date.getTime() - 2 * 60 * 60 * 1000),
      completedAt: date,
      createdAt: new Date(date.getTime() - 24 * 60 * 60 * 1000),
      ordererName: customerNames[index],
    });
  });

  return orders;
};

export const mockOrders = generateMockOrders();

// Helper to calculate daily points
export const calculateDailyPoints = (orders: Order[]): DailyPoints[] => {
  const pointsMap = new Map<string, DailyPoints>();

  orders
    .filter(o => o.status === 'completed' && o.completedAt && o.claimedBy)
    .forEach(order => {
      const dateKey = order.completedAt!.toISOString().split('T')[0];
      const mapKey = `${order.claimedBy}-${dateKey}`;

      if (pointsMap.has(mapKey)) {
        const existing = pointsMap.get(mapKey)!;
        existing.totalPoints += order.points;
        existing.ordersCompleted += 1;
      } else {
        pointsMap.set(mapKey, {
          sewerId: order.claimedBy!,
          sewerName: order.claimedByName!,
          date: dateKey,
          totalPoints: order.points,
          ordersCompleted: 1,
        });
      }
    });

  return Array.from(pointsMap.values()).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const dailyPointsData = calculateDailyPoints(mockOrders);

// Calculate average time per point (mock estimate)
export const AVERAGE_MINUTES_PER_POINT = 15;

export const calculateEstimatedTime = (totalPoints: number): string => {
  const minutes = totalPoints * AVERAGE_MINUTES_PER_POINT;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};
