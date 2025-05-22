export interface DebtRecord {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  totalOrders: number;     // Số lượng đơn hàng
  totalOrderValue?: number; // Tổng giá trị đơn hàng
  totalPaid?: number;      // Đã thanh toán, có thể có tên totalPayments từ API
  remainingDebt: number;   // Còn nợ
  hasDebt?: boolean;       // Có nợ hay không
}

export interface DebtDetails {
  customerName: string;
  customerId: string;
  totalDebt: number;
  orders: DebtOrderDetail[];
  
}

export interface DebtOrderDetail {
  orderId: string;
  orderCode: string;
  orderDate: string;
  total: number;
  paid: number;
  remaining: number;
  items?: any[];
  lastPaymentDate?: string | null; // Ngày thanh toán gần nhất
}
