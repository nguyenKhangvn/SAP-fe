import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Product {
  _id?: string;
  code: string;
  name: string;
  costPrice: number;
  salePrice: number;
  oldStock?: number;
  newStock?: number;
  imported?: number;
  exported?: number;
}

export interface StockHistory {
  _id?: string;
  productCode: string;
  date: string;
  type: 'import' | 'export';
  quantity: number;
  oldStock: number;
  newStock: number;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private stocksUrl = `${environment.apiUrl}/stocks`;

  constructor(private http: HttpClient) {}

  // Get all products
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  // Get product by ID
  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  // Add new product
  addProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  // Update product
  updateProduct(product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${product._id}`, product);
  }

  // Delete product
  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Get stock history for a product
  getStockHistory(productCode: string): Observable<StockHistory[]> {
    return this.http.get<StockHistory[]>(`${this.stocksUrl}/history/${productCode}`);
  }

  // Update stock for a product (import or export)
  updateStock(
    productCode: string,
    type: 'import' | 'export',
    quantity: number,
    notes?: string
  ): Observable<any> {
    return this.http.post(`${this.stocksUrl}/update-stats`, {
      productCode,
      type,
      quantity,
      notes
    });
  }

  // Get inventory report
  getInventoryReport(): Observable<any> {
    return this.http.get(`${this.stocksUrl}/report`);
  }
}