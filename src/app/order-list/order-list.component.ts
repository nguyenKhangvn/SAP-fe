import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { OrderService } from '../services/order.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css']
})
export class OrderListComponent implements OnInit {
  displayedColumns: string[] = ['customer', 'date', 'isPaid', 'total', 'actions'];
  orders: any[] = [];
  selectedCustomer: any; 
  customers: any[] = [];
  isLoading = false;

  constructor(
    private http: HttpClient, 
    private orderService: OrderService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading = true;
    this.orderService.getAllOrders()
      .subscribe({
        next: (res: any) => {
          this.orders = res;
          console.log('Orders:', this.orders);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading orders:', err);
          this.isLoading = false;
          this.snackBar.open('Không thể tải danh sách đơn hàng', 'Đóng', { duration: 3000 });
        }
      });
  }

  deleteOrder(order: any) {
    if (confirm(`Bạn có chắc chắn muốn xóa đơn hàng?`)) {
      this.isLoading = true;
      this.orderService.deleteOrder(order._id).subscribe({
        next: () => {
          this.snackBar.open('Đã xóa đơn hàng thành công', 'Đóng', { duration: 3000 });
          this.loadOrders();
        },
        error: (err) => {
          console.error('Error deleting order:', err);
          this.isLoading = false;
          this.snackBar.open('Không thể xóa đơn hàng: ' + (err.error?.error || 'Lỗi không xác định'), 'Đóng', { duration: 5000 });
        }
      });
    }
  }
}
