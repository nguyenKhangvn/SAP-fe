import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { OrderService } from '../services/order.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { firstValueFrom } from 'rxjs';
import { OrderDetailDialogComponent } from '../order-detail-dialog/order-detail-dialog.component';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css']
})
export class OrderListComponent implements OnInit {
  displayedColumns: string[] = ['orderCode', 'customer', 'date', 'isPaid', 'total', 'actions'];
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

  async exportToExcel(selectedMonth?: string): Promise<void> {
    this.isLoading = true;
    let filteredOrders = this.orders;
    
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number); // "2025-05" => [2025, 5]

      filteredOrders = this.orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.getMonth() + 1 === month && orderDate.getFullYear() === year;
      });

      if (filteredOrders.length === 0) {
        alert('Không có đơn hàng nào trong tháng đã chọn.');
        this.isLoading = false;
        return;
      }
    }

    try {
      // Fetch profit information for each order
      const ordersWithProfit = await Promise.all(
        filteredOrders.map(async (order) => {            try {
            const orderDetails = await firstValueFrom(this.orderService.getOrderProducts(order._id));
            const products = orderDetails?.products || [];
            
            // Calculate total profit from all products
            const totalProfit = products.reduce((sum: number, product: any) => sum + (product.profit || 0), 0);
            return {
              ...order,
              totalProfit
            };
          } catch (error) {
            console.error(`Error fetching details for order ${order._id}:`, error);
            return {
              ...order,
              totalProfit: 0
            };
          }
        })
      );

      const worksheet = XLSX.utils.json_to_sheet(ordersWithProfit.map(order => ({
        'Mã đơn': order.orderCode,
        'Khách hàng': order.customerId?.name || '—',
        'Ngày': new Date(order.date).toLocaleDateString('vi-VN'),
        'Trạng thái': order.isPaid ? 'Đã thanh toán' : 'Còn nợ',
        'Lợi nhuận': order.totalProfit || 0,
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
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.snackBar.open('Không thể xuất file Excel', 'Đóng', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  onMonthChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedMonth = input.value; // Lưu giá trị tháng được chọn
  }

  onRowClick(event: MouseEvent, order: any): void {
    // Check if the click is in the actions column
    const target = event.target as HTMLElement;
    const clickedCell = target.closest('td');
    
    if (clickedCell && clickedCell.classList.contains('mat-column-actions')) {
      // If click is on actions column, don't open details
      return;
    }
    
    // Otherwise open the order details
    this.openOrderDetails(order);
  }

  openOrderDetails(order: any) {
    this.dialog.open(OrderDetailDialogComponent, {
      width: '800px',
      data: { orderId: order._id }
    });
  }
}
