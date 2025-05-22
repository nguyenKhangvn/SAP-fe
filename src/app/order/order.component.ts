import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../services/products.service';
import { CustomerService } from '../services/customers.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})

export class OrderComponent implements OnInit {
  orderCode = '';
  selectedCustomer: string | null = null;
  status = 'paid';
  customers: any[] = [];
  products: any[] = [];
  orderItems: any[] = [];
  isMobile: boolean = false;
  screenWidth: number = 0;

  constructor(
            private http: HttpClient, 
            private productService: ProductService,
            private customerService: CustomerService,
            private snackBar: MatSnackBar,
            private orderService: OrderService
          ) {
    // Check initial screen size
    this.screenWidth = window.innerWidth;
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?: any) {
    this.screenWidth = window.innerWidth;
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = this.screenWidth < 600;
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadProducts();
  }
  loadCustomers() {
   this.customerService.getCustomers().subscribe({
      next: (res: any) => this.customers = res,
      error: err => alert('Có lỗi xảy ra: '  + err.error.message)
   });
  }
  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (res: any) => this.products = res,
      error: err => alert('Có lỗi xảy ra: ' + err.error.message)
    });
  }

  addItem() {
    this.orderItems.push({ productCode: '', quantity: 1, price: 0 });
  }

  removeItem(index: number) {
    this.orderItems.splice(index, 1);
  }

  getTotal(): number {
    return this.orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  }

  isFormValid(): boolean {

    
    // Check if at least one order item exists and is valid
    if (this.orderItems.length === 0) {
      return false;
    }
    
    // Check if all order items have product, quantity, and price
    for (const item of this.orderItems) {
      if (!item.productCode || item.quantity <= 0 || item.price <= 0) {
        return false;
      }
    }
    
    return true;
  }
  //diplay price of product
  onProductChange(item: any) {
    const selectedProduct = this.products.find(p => p.code === item.productCode);
    if (selectedProduct) {
      item.price = selectedProduct.salePrice;
    } else {
      item.price = 0; 
    }
  }

  submitOrder() {
    if (!this.isFormValid()) {
      this.snackBar.open('Vui lòng điền đầy đủ thông tin đơn hàng', 'Đóng', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    if (!this.selectedCustomer) {
      this.snackBar.open('Vui lòng chọn khách hàng', 'Đóng', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    const ORDorderCode = `ORD-${Date.now()}`;
    const payload = {
      orderCode: ORDorderCode,
      customerId: this.selectedCustomer,
      status: this.status,
      items: this.orderItems,
      total: this.getTotal()
    };
    // this.http.post('http://localhost:5000/api/orders', payload).subscribe({
      this.orderService.addOrder(payload).subscribe({
      next: res => {
        this.snackBar.open('Đặt hàng thành công!', 'Đóng', {
          duration: 3000
        });
        // Reset form after successful order
        this.resetForm();
      },
      error: err => this.snackBar.open('Có lỗi xảy ra: ' + err.error.message, 'Đóng', {
        duration: 3000,
        panelClass: ['error-snackbar']
      })
    });
  }

  resetForm() {
    this.orderCode = '';
    this.selectedCustomer = null;
    this.status = 'paid';
    this.orderItems = [];
  }
}
