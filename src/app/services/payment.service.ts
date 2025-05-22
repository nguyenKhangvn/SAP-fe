import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface Payment {
  _id?: string;
  customerId: any; // Can be string or object with _id property
  customerName?: string; // Optional, for display only
  amount: number;
  date: string;
  type: 'payment' | 'expense' | 'new_debt' | 'debt_collected';
  note?: string;
  orderId?: any; // Can be string or object with orderCode
  paymentMethod?: 'cash' | 'bank' | 'card'; // Added for payment method tracking
}

export interface BatchPaymentRequest {
  payments: Payment[];
  customerId: string;
  totalAmount: number;
  date: string;
  paymentMethod?: 'cash' | 'bank' | 'card';
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private baseUrl = environment.apiUrl + '/payments';

  constructor(private http: HttpClient) {}
  getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.baseUrl)
      .pipe(
        catchError(error => {
          console.error('Error fetching payments:', error);
          // Return empty array instead of throwing an error
          return of([]);
        })
      );
  }

  addPayment(payment: Payment): Observable<any> {
    return this.http.post(this.baseUrl, payment);
  }

  deletePayment(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
  
  updatePayment(id: string, payment: Payment): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, payment);
  }

  /**
   * Process batch payment for multiple orders
   * @param batchRequest The batch payment request containing payment details for multiple orders
   * @returns Observable with the response from the API
   */
  processBatchPayment(batchRequest: BatchPaymentRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/pay-multiple-orders`, batchRequest);
  }
}
