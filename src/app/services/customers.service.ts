import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Customer {
  _id?: string;
  name: string;
  phone?: string;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaginatedResponse {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly apiUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  /**
   * Get all customers with pagination and search
   */
  getCustomersToPage(
    page: number = 1,
    pageSize: number = 10,
    searchTerm: string = ''
  ): Observable<PaginatedResponse> {
    const params = {
      page: page.toString(),
      pageSize: pageSize.toString(),
      search: searchTerm
    };
    return this.http.get<PaginatedResponse>(this.apiUrl, { params });
  }

  /**
   * Get a single customer by ID
   */
  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new customer
   */
    addCustomer(customer: Customer): Observable<any> {
    return this.http.post(this.apiUrl, customer);
  }

  /**
   * Update an existing customer
   */
  updateCustomer(id: string, customer: Partial<Customer>): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, customer);
  }

  /**
   * Delete a customer
   */
  deleteCustomer(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Search customers by name or phone
   */
  searchCustomers(term: string): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.apiUrl}/search`, {
      params: { term }
    });
  }

getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.apiUrl}/all`);
  }
}