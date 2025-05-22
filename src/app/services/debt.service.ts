import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { DebtRecord, DebtDetails } from '../models/debt.model';
import { environment } from '../../environments/environment';

export interface CustomerDebtResponse {
  customer: any; // You might have a Customer interface here
  summary: any;  // You might have a Summary interface here
  orders: any[]; // You might have an Order interface here, e.g., Order[]
  payments: any[]; // You might have a Payment interface here
}

@Injectable({ providedIn: 'root' })
export class DebtService {
  private baseUrl = environment.apiUrl + '/debts';

  constructor(private http: HttpClient) {}
  /**
   * Get all customer debts summary
   */  getCustomerDebts(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/customer-debts`).pipe(
      map(response => {
        // Trả về response nguyên vẹn, component sẽ xử lý
        if (response) {
          return response;
        }
        // Default to empty object structure if response is empty
        return { items: [], totalCustomersWithDebt: 0, totalDebtAmount: 0 };
      }),
      catchError(error => {
        console.error('Error fetching debt data:', error);
        return of({ items: [], totalCustomersWithDebt: 0, totalDebtAmount: 0 });
      })
    );
  }
  /**
   * Get detailed debt information for a specific customer
   */
  getCustomerDebtDetails(customerId: string): Observable<DebtDetails> {
    return this.http.get<any>(`${this.baseUrl}/customer-debt/${customerId}`).pipe(
      map(response => {
        if (!response) {
          console.warn('Empty response from customer debt details API');
          return { customerId, customerName: '', orders: [], totalDebt: 0 } as DebtDetails;
        }

        if (response.orders) {
          response.orders = response.orders.map((order: any) => ({
            ...order,
            lastPaymentDate: order.lastPaymentDate || null
          }));
        }
        console.log('Customer debt details:', response.orders);

        return response;
      }),
      catchError(error => {
        console.error(`Error fetching debt details for customer ${customerId}:`, error);
        return of({ customerId, customerName: '', orders: [], totalDebt: 0 } as DebtDetails);
      })
    );
  }

  /**
   * Record a payment against customer debt
   */
  payOrderDebt(paymentData: any): Observable<any> {
    return this.http.post(environment.apiUrl + '/payments/pay-order-debt', paymentData);
  }

  /**
   * Record batch payments for multiple orders
   */
  payBatchOrderDebt(batchPaymentData: any): Observable<any> {
    return this.http.post(environment.apiUrl + '/payments/batch-payment', batchPaymentData);
  }

  /**
   * Get orders with outstanding debt for a specific customer
   */
  getCustomerDebtOrders(customerId: string): Observable<CustomerDebtResponse> { // <--- Change return type to the object
  return this.http.get<CustomerDebtResponse>(`${this.baseUrl}/customer-debt/${customerId}`).pipe( // <--- Expect the object here
    map(response => {
      // You now expect the full object here, so this check needs to change.
      // If the API always returns 'orders' property, even if empty, this simplified check works:
      if (!response || !response.orders) { // Check if response or response.orders is missing
        console.warn('Empty or invalid response from customer debt orders API');
        return { customer: null, summary: null, orders: [], payments: [] }; // Return a default structure
      }
      console.log('Customer debt orders (full response):', response);
      return response; // Return the full response object
    }),
    catchError(error => {
      console.error(`Error fetching debt orders for customer ${customerId}:`, error);
      // Return an Observable of a default object structure on error
      return of({ customer: null, summary: null, orders: [], payments: [] });
    })
  );
}
  
  /**
   * Calculate total debt for a customer or for all customers
   */
  calculateTotalDebt(debts: DebtRecord[]): number {
    if (!debts || !Array.isArray(debts) || debts.length === 0) {
      return 0;
    }
    
    return debts.reduce((total, debt) => {
      const debtAmount = typeof debt.remainingDebt === 'number' ? debt.remainingDebt : 0;
      return total + debtAmount;
    }, 0);
  }
  
  /**
   * Get formatted currency string
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  /**
   * Export debts to CSV format
   */  exportDebtsToCSV(debts: DebtRecord[]): string {
    if (!debts || debts.length === 0) {
      return '';
    }

    // CSV Headers
    const headers = ['STT', 'Tên khách hàng', 'SĐT', 'Tổng đơn hàng (VND)', 'Đã thanh toán (VND)', 'Còn nợ (VND)'];
    
    // Format data rows
    const rows = debts.map((debt, index) => [
      (index + 1).toString(),
      debt.customerName,
      debt.customerPhone || '',
      debt.totalOrders.toString(),
      (debt.totalPaid !== undefined ? debt.totalPaid : (debt.totalOrderValue || 0) - debt.remainingDebt).toString(),
      debt.remainingDebt.toString()
    ]);
    
    // Add total row
    const totalDebt = this.calculateTotalDebt(debts);
    const totalOrders = debts.reduce((sum, debt) => sum + debt.totalOrders, 0);
    const totalPaid = debts.reduce((sum, debt) => {
      const paid = debt.totalPaid !== undefined ? debt.totalPaid : 
                  (debt.totalOrderValue !== undefined ? debt.totalOrderValue - debt.remainingDebt : 0);
      return sum + paid;
    }, 0);
    
    rows.push([
      '',
      'TỔNG CỘNG',
      '',
      totalOrders.toString(),
      totalPaid.toString(),
      totalDebt.toString()
    ]);
    
    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  }
  
  /**
   * Download CSV file with debt data
   */
  downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Create download link
    if ((navigator as any).msSaveBlob) { // For IE
      (navigator as any).msSaveBlob(blob, filename);
    } else {
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
