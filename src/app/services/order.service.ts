import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface Order {
    _id?: string;
    orderCode: string;
    customerId: any; // Can be string or object with _id property
    customerName?: string; // Optional, for display only
    total: number;
    date: string;
    status: string;
    note?: string;
    paymentStatus?: string; // Added for payment status tracking
}


@Injectable({ providedIn: 'root' })
export class OrderService {
    private readonly apiUrl = 'http://localhost:5000/api/orders'; // Adjust to your API URL
    
    constructor(private http: HttpClient) {

    }
    /**
     * Get all orders with pagination and search
     */
    getOrdersToPage(
        page: number = 1,
        pageSize: number = 10,
        searchTerm: string = ''
    ): Observable<any> {
        const params = {
            page: page.toString(),
            pageSize: pageSize.toString(),
            search: searchTerm
        };
        return this.http.get<any>(this.apiUrl, { params });
    }
    /**
     * Get a single order by ID
     */
    getOrderById(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }
    /**
     * Create a new order
     */
    addOrder(order: any): Observable<any> {
        return this.http.post(this.apiUrl, order);
    }
    /**
     * Update an existing order
     */
    updateOrder(id: string, order: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, order);
    }
    /**
     * Delete an order
     */
    deleteOrder(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
    /**
     * Get all orders
     */
    getAllOrders(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }
    /**
     * Get all orders by customer ID
     */
    getOrdersByCustomerId(customerId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/customer/${customerId}`);
    }
    /**
     * Get all orders by product code
     */
    getOrdersByProductCode(productCode: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/product/${productCode}`);
    }
    /**
     * Get all orders by date range
     */
    getOrdersByDateRange(startDate: string, endDate: string): Observable<any[]> {
        const params = {
            startDate,
            endDate
        };
        return this.http.get<any[]>(`${this.apiUrl}/date-range`, { params });
    }
    /**
     * Get all orders by status
     */
    getOrdersByStatus(status: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/status/${status}`);
    }
    /**
     * Get all orders by payment status
     */
    getOrdersByPaymentStatus(paymentStatus: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/payment-status/${paymentStatus}`);
    }
    /**
     * Get all orders by customer name
     */
    getOrdersByCustomerName(customerName: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/customer-name/${customerName}`);
    }
    /**
     * Get all orders by order code
     */
    getOrdersByOrderCode(orderCode: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/order-code/${orderCode}`);
    }
    /**
     * Get all orders by order date
     */
    getOrdersByOrderDate(orderDate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/order-date/${orderDate}`);
    }
    /**
     * Get all orders by customer phone
     */
    getOrdersByCustomerPhone(customerPhone: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/customer-phone/${customerPhone}`); 
    }
}