import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface DashboardStats {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalRevenue: number;
  totalDebt: number;
  recentOrders: RecentOrder[];
  allOrders: RecentOrder[];
  ordersByStatus: { [key: string]: number };
  topProducts: TopProduct[];
  salesOverTime: SalesOverTime[];
}

export interface InventoryStats {
  inventorySummary: InventoryItem[];
  lowStockProducts: InventoryItem[];
  totalProductsInStock: number;
  totalOutOfStock: number;
  totalInventoryCostValue?: number; // Total value based on cost price
  totalInventorySaleValue?: number; // Total value based on sale price
}

export interface CustomerStats {
  topCustomers: TopCustomer[];
  newCustomers: number;
  customersWithDebt: CustomerWithDebt[];
  totalCustomers: number;
}

export interface RecentOrder {
  _id: string;
  orderCode: string;
  date: string;
  customerId: {
    _id: string;
    name: string;
  };
  total: number;
  status: string;
  isPaid: boolean;
}

export interface TopProduct {
  _id: string;
  totalQuantity: number;
  name: string;
}

export interface SalesOverTime {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface InventoryItem {
  _id: string;
  productCode: string;
  currentStock: number;
  oldStock: number;
  newStock: number;
  totalImported: number;
  totalExported: number;
  costValue?: number; // Value based on cost price
  saleValue?: number; // Value based on sale price
}

export interface TopCustomer {
  _id: string;
  totalSpent: number;
  orderCount: number;
  name: string;
  averageOrderValue: number;
}

export interface CustomerWithDebt {
  _id: string;
  totalDebt: number;
  name: string;
  phone: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Get all dashboard statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Get inventory statistics
   */
  getInventoryStats(): Observable<InventoryStats> {
    return this.http.get<InventoryStats>(`${this.apiUrl}/inventory`);
  }

  /**
   * Get customer statistics
   */
  getCustomerStats(): Observable<CustomerStats> {
    return this.http.get<CustomerStats>(`${this.apiUrl}/customers`);
  }

  /**
   * Get all dashboard data at once
   */
  getAllDashboardData() {
    return forkJoin({
      stats: this.getDashboardStats(),
      inventory: this.getInventoryStats(),
      customers: this.getCustomerStats()
    });
  }
}
