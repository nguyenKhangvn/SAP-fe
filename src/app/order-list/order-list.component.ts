import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { OrderService } from '../services/order.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { OrderDetailDialogComponent } from '../order-detail-dialog/order-detail-dialog.component';

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
  selectedMonth: string = ''; // Lưu trữ tháng được chọn

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

  exportToExcel(selectedMonth?: string): void {
    let filteredOrders = this.orders;

    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number); // "2025-05" => [2025, 5]

      filteredOrders = this.orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.getMonth() + 1 === month && orderDate.getFullYear() === year;
      });

      if (filteredOrders.length === 0) {
        alert('Không có đơn hàng nào trong tháng đã chọn.');
        return;
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredOrders.map(order => ({
      'Mã đơn': order.orderCode,
      'Khách hàng': order.customerId?.name || '—',
      'Ngày': new Date(order.date).toLocaleDateString('vi-VN'), // Định dạng ngày tháng năm
      'Trạng thái': order.isPaid ? 'Đã thanh toán' : 'Còn nợ',
      'Tổng tiền': order.total
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Đơn hàng theo tháng');

    const fileName = selectedMonth
      ? `Don_hang_thang_${selectedMonth.replace('-', '_')}.xlsx`
      : `Don_hang_tat_ca.xlsx`;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  }

  onMonthChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedMonth = input.value; // Lưu giá trị tháng được chọn
  }

  openOrderDetails(order: any) {
    this.dialog.open(OrderDetailDialogComponent, {
      width: '800px',
      data: { orderId: order._id }
    });
  }
}
