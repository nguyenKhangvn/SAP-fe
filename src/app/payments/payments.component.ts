import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { HttpClient } from '@angular/common/http';

import { PaymentDialogComponent } from '../payment-dialog/payment-dialog.component';
import { Payment, PaymentService, BatchPaymentRequest } from '../services/payment.service';
import { CustomerService } from '../services/customers.service';
import { DebtRecord, DebtDetails } from '../models/debt.model';
import { DebtService } from '../services/debt.service';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css', './payments-v1.component.css'],
})
export class PaymentsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  displayedColumns: string[] = ['index', 'customerName', 'amount', 'date', 'note', 'actions'];
  debtColumns: string[] = ['index', 'customerName', 'totalOrders', 'totalPaid', 'remainingDebt', 'actions'];
  
  dataSource = new MatTableDataSource<Payment>([]);
  debtDataSource = new MatTableDataSource<DebtRecord>([]);
  originalDebtData: DebtRecord[] = [];
  
  currentType: string = 'payment';
  selectedCustomer: string = '';
  viewMode: string = 'payments';
  
  isLoading: boolean = false;
  totalRecords: number = 0;
  pageSize: number = 10;
  
  isMobile: boolean = false;
  screenWidth: number = 0;
  
  customers: any[] = [];
  totalDebt: number = 0;

  customer: any;
  summary: any;
  orders: any[] = [];
  payments: any[] = [];

  constructor(
    private paymentService: PaymentService,
    private customerService: CustomerService,
    private debtService: DebtService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private http: HttpClient
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
    this.loadPayments();
    if (this.viewMode === 'debts') {
      this.loadDebts();
    }
  }
  
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
  
  // Handle view mode change
  onViewModeChange(): void {
    if (this.viewMode === 'payments') {
      this.loadPayments();
    } else if (this.viewMode === 'debts') {
      this.loadDebts();
    }
  }

  // Load danh sách khách hàng
  loadCustomers(): void {
    this.isLoading = true;
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách khách hàng:', err);
        this.isLoading = false;
      }
    });
  }

  // Load danh sách thanh toán
  loadPayments(): void {
    this.isLoading = true;
    
    try {
      this.paymentService.getPayments().subscribe({
        next: (data) => {
          try {
            console.log('Payment data received:', data);
            
            // Check if data is valid
            if (!data || !Array.isArray(data)) {
              console.error('Invalid data format received:', data);
              this.dataSource.data = [];
              this.totalRecords = 0;
              this.isLoading = false;
              return;
            }
            // Filter data by type
            const filteredData = Array.isArray(data) ? data.filter(payment => 
              payment && payment.type === 'debt_collected'
            ) : [];

            console.log('Filtered data by type:', filteredData);
            
            // Apply customer filter if selected
            if (this.selectedCustomer) {
              this.dataSource.data = filteredData.filter(p => {
                if (!p || !p.customerId) return false;
                
                if (typeof p.customerId === 'object' && p.customerId !== null) {
                  return p.customerId._id === this.selectedCustomer;
                } else {
                  return p.customerId === this.selectedCustomer;
                }
              });
            } else {
              this.dataSource.data = filteredData;
            }
            
            this.totalRecords = this.dataSource.data.length;
          } catch (parseError) {
            console.error('Error processing payment data:', parseError);
            this.dataSource.data = [];
            this.totalRecords = 0;
            this.showSnackBar('Lỗi xử lý dữ liệu thanh toán');
          } finally {
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Lỗi khi tải dữ liệu:', err);
          this.showSnackBar('Không thể tải danh sách thanh toán');
          this.dataSource.data = [];
          this.totalRecords = 0;
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Exception in loadPayments:', error);
      this.isLoading = false;
      this.showSnackBar('Lỗi hệ thống khi tải danh sách thanh toán');
    }
  }
  
  // Load danh sách công nợ
  loadDebts(): void {
    this.isLoading = true;
    
    // Using the debt service to get customer debts
    this.debtService.getCustomerDebts().subscribe({
      next: (response: any) => {
        // Xử lý response theo đúng cấu trúc
        let debts: DebtRecord[] = [];
        
        if (response) {
          // Kiểm tra nếu response là cấu trúc dạng { items: [...], totalCustomersWithDebt: x, totalDebtAmount: y }
          if (response.items && Array.isArray(response.items)) {
            debts = response.items;
            // Nếu có dữ liệu tổng số nợ từ API, sử dụng nó
            if (typeof response.totalDebtAmount === 'number') {
              this.totalDebt = response.totalDebtAmount;
            }
          } 
          // Hoặc nếu response trực tiếp là một mảng
          else if (Array.isArray(response)) {
            debts = response;
          }
          // Nếu không phải array và không có items, ghi log lỗi
          else {
            console.error('Dữ liệu công nợ không đúng định dạng:', response);
          }
        }
        
        // Save original data for filtering
        this.originalDebtData = [...debts];
        
        // Apply customer filter if selected
        this.debtDataSource.data = this.selectedCustomer 
          ? debts.filter((d: DebtRecord) => d.customerId === this.selectedCustomer) 
          : debts;
        
        this.totalRecords = this.debtDataSource.data.length;
        
        // Calculate total debt if not already set from response
        if (typeof this.totalDebt !== 'number' || isNaN(this.totalDebt)) {
          this.calculateTotalDebt();
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu công nợ:', err);
        this.showSnackBar('Không thể tải thông tin công nợ');
        this.isLoading = false;
      }
    });
  }

  // Enhanced dialog opener for all payment operations
  openPaymentDialog(mode: 'add' | 'edit', data?: Payment): void {
    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: this.isMobile ? '95%' : '500px',
      panelClass: ['responsive-dialog', 'mat-elevation-z3'],
      data: {
        mode: mode,
        payment: data || null,
        type: this.currentType
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        if (mode === 'add') {
          this.paymentService.addPayment(result).subscribe({
            next: () => {
              this.loadPayments();
              if (this.viewMode === 'debts') {
                this.loadDebts();
              }
              this.showSnackBar('Đã thêm giao dịch thành công');
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Lỗi khi thêm dữ liệu:', err);
              this.showSnackBar('Không thể thêm giao dịch');
              this.isLoading = false;
            }
          });
        } else if (mode === 'edit' && result._id) {
          this.paymentService.updatePayment(result._id, result).subscribe({
            next: () => {
              this.loadPayments();
              if (this.viewMode === 'debts') {
                this.loadDebts();
              }
              this.showSnackBar('Đã cập nhật giao dịch thành công');
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Lỗi khi cập nhật dữ liệu:', err);
              this.showSnackBar('Không thể cập nhật giao dịch');
              this.isLoading = false;
            }
          });
        }
      }
    });
  }

  // Confirm Delete Payment
  confirmDeletePayment(payment: Payment): void {
    if (!payment._id) {
      this.showSnackBar('Không thể xóa: ID không hợp lệ');
      return;
    }
    
    const confirmDialog = this.dialog.open(PaymentDialogComponent, {
      width: this.isMobile ? '95%' : '400px',
      panelClass: 'responsive-dialog',
      data: {
        mode: 'confirm-delete',
        payment: payment
      }
    });

    confirmDialog.afterClosed().subscribe(confirmed => {
      if (confirmed && payment._id) {
        this.isLoading = true;
        this.paymentService.deletePayment(payment._id).subscribe({
          next: () => {
            this.loadPayments();
            if (this.viewMode === 'debts') {
              this.loadDebts();
            }
            this.showSnackBar('Đã xóa giao dịch thành công');
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Lỗi khi xóa dữ liệu:', err);
            this.showSnackBar('Không thể xóa giao dịch');
            this.isLoading = false;
          }
        });
      }
    });
  }

  // Filter by customer
  filterByCustomer(): void {
    if (this.viewMode === 'payments') {
      this.loadPayments();
    } else if (this.viewMode === 'debts') {
      this.loadDebts();
    }
  }
  
  // Filter by payment type (thu/chi)
  filterPayments(): void {
    this.loadPayments();
  }

  // Handle page change
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
  }
  
  // View debt details for customer
  viewDebtDetail(customer: DebtRecord): void {
    this.isLoading = true;

    this.debtService.getCustomerDebtDetails(customer.customerId).subscribe({
      next: (data: any) => {
        try {
          // Create a safe copy of the data to work with
          const safeData: DebtDetails = {
            customerId: data.customerId || customer.customerId,
            customerName: data.customerName || customer.customerName,
            totalDebt: data.totalDebt || customer.remainingDebt || 0,
            // startDate: data.startDate || new Date('2025-01-01').toISOString(),
            // endDate: data.endDate || new Date().toISOString(),
            orders: []
          };
          
          // Process orders safely with proper typing
          if (data.orders && Array.isArray(data.orders)) {
            safeData.orders = data.orders.map((order: any) => ({
              orderId: order.orderId,
              orderCode: order.orderCode,
              orderDate: order.orderDate,
              total: order.totalAmount,
              paid: order.totalPaid,
              remaining: order.remainingDebt,
              items: [],
              lastPaymentDate: null
            }));
          }

          // Open dialog with debt details
          this.dialog.open(PaymentDialogComponent, {
            width: this.isMobile ? '95%' : '600px',
            panelClass: 'responsive-dialog',
            data: {
              mode: 'view-debt',
              debtDetails: safeData
            }
          });
        } catch (error) {
          console.error('Lỗi xử lý dữ liệu công nợ:', error);
          this.showSnackBar('Có lỗi xử lý dữ liệu công nợ');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải chi tiết công nợ:', err);
        this.showSnackBar('Không thể tải chi tiết công nợ');
        this.isLoading = false;
      }
    });
  }
  
  // Record debt payment
  recordDebtPayment(customer: DebtRecord): void {
    if (customer.remainingDebt <= 0) {
      this.showSnackBar('Khách hàng không có công nợ cần thanh toán');
      return;
    }
    
    // Open dialog to record payment
    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: this.isMobile ? '95%' : '500px',
      panelClass: 'responsive-dialog',
      data: {
        mode: 'pay-debt',
        customer: customer,
        paymentAmount: customer.remainingDebt
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Call service to record debt payment
        this.debtService.payOrderDebt(result).subscribe({
          next: () => {
            // Show success dialog
            const successDialog = this.dialog.open(PaymentDialogComponent, {
              width: this.isMobile ? '95%' : '400px',
              panelClass: 'responsive-dialog',
              data: {
                mode: 'payment-success',
                paymentInfo: {
                  customerName: customer.customerName,
                  amount: result.amount,
                  paymentMethod: result.paymentMethod
                }
              }
            });
            
            // Reload data after dialog close
            successDialog.afterClosed().subscribe(() => {
              this.loadDebts();
              this.loadPayments();
            });
          },
          error: (err) => {
            console.error('Lỗi khi ghi nhận thanh toán:', err);
            this.showSnackBar('Không thể ghi nhận thanh toán công nợ');
          }
        });
      }
    });
  }

  // New function for batch payment of multiple orders
  recordBatchDebtPayment(customer: DebtRecord): void {
  if (customer.remainingDebt <= 0) {
    this.showSnackBar('Khách hàng không có công nợ cần thanh toán');
    return;
  }

  this.isLoading = true;
  console.log('Fetching orders for customer ID:', customer.customerId);
  this.debtService.getCustomerDebtOrders(customer.customerId).subscribe({
    next: (res: any) => {
            // --- ADD THESE CONSOLE LOGS ---
      console.log('API Response received:', res);
      console.log('Type of res.orders:', typeof res.orders);
      console.log('Is res.orders an array?', Array.isArray(res.orders));
      console.log('Length of res.orders:', res.orders ? res.orders.length : 'undefined/null');
      // --- END ADDITIONS ---
      this.isLoading = false;

      if (!res.orders || res.orders.length === 0) {
        this.showSnackBar('Không tìm thấy đơn hàng còn nợ cho khách hàng này');
        return;
      }

      // Format orders data for the dialog.
      // Ensure 'remaining' is treated as a number.
      const formattedOrders = res.orders.map((order: any) => ({
        orderId: order._id || order.orderId,
        orderCode: order.orderCode,
        orderDate: order.orderDate,
        total: order.totalAmount,
        paid: order.totalPaid,
        remaining: Number(order.remainingDebt) // Explicitly cast to number
      }));

      const dialogRef = this.dialog.open(PaymentDialogComponent, {
        width: this.isMobile ? '95%' : '600px',
        panelClass: 'responsive-dialog',
        data: {
          mode: 'batch-payment',
          customer: customer, // Already has customerName and remainingDebt
          orders: formattedOrders
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.paymentService.processBatchPayment(result).subscribe({
            next: () => {
              const successDialog = this.dialog.open(PaymentDialogComponent, {
                width: this.isMobile ? '95%' : '400px',
                panelClass: 'responsive-dialog',
                data: {
                  mode: 'payment-success',
                  paymentInfo: {
                    customerName: customer.customerName,
                    amount: result.totalAmount,
                    paymentMethod: result.paymentMethod,
                    isBatch: true,
                    orderCount: result.payments.length
                  }
                }
              });

              successDialog.afterClosed().subscribe(() => {
                this.loadDebts();
                this.loadPayments();
              });
            },
            error: (err) => {
              console.error('Lỗi khi xử lý thanh toán hàng loạt:', err);
              this.showSnackBar('Không thể xử lý thanh toán nhiều đơn hàng');
            }
          });
        }
      });
    },
    error: (err) => {
      this.isLoading = false;
      console.error('Lỗi khi tải dữ liệu đơn hàng:', err);
      this.showSnackBar('Không thể tải thông tin đơn hàng của khách hàng');
    }
  });
}

  // Simplified method to handle both add and edit
  openDialog(mode: 'add' | 'edit', data?: Payment): void {
    this.openPaymentDialog(mode, data);
  }

  // Simplified method to handle payment deletion
  deletePayment(payment: Payment): void {
    if (payment) {
      this.confirmDeletePayment(payment);
    } else {
      this.showSnackBar('Không thể xóa: Dữ liệu không hợp lệ');
    }
  }

  // Hiển thị thông báo
  showSnackBar(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Đóng', { duration });
  }

  // Apply filter to debt records
  applyDebtFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    
    if (!filterValue) {
      this.debtDataSource.data = this.originalDebtData;
      this.calculateTotalDebt();
      return;
    }
    
    const lowerCaseFilter = filterValue.trim().toLowerCase();
    this.debtDataSource.data = this.originalDebtData.filter((debt: DebtRecord) => 
      debt.customerName.toLowerCase().includes(lowerCaseFilter) || 
      (debt.customerPhone && debt.customerPhone.includes(filterValue))
    );
    
    this.calculateTotalDebt();
  }

  // Calculate total debt
  private calculateTotalDebt(): void {
    if (this.debtDataSource && this.debtDataSource.data && this.debtDataSource.data.length > 0) {
      this.totalDebt = this.debtService.calculateTotalDebt(this.debtDataSource.data);
    } else {
      this.totalDebt = 0;
    }
  }

  // Export debts to CSV
  exportDebts(): void {
    if (this.debtDataSource.data.length === 0) {
      this.showSnackBar('Không có dữ liệu công nợ để xuất');
      return;
    }

    const csvContent = this.debtService.exportDebtsToCSV(this.debtDataSource.data);
    const today = new Date().toISOString().slice(0, 10);
    const filename = `bao-cao-cong-no-${today}.csv`;
    
    this.debtService.downloadCSV(csvContent, filename);
    this.showSnackBar('Đã xuất báo cáo công nợ thành công');
  }

  // Test direct API connection
  testApiConnection(): void {
    this.isLoading = true;
    this.http.get('http://localhost:5000/api/payments')
      .subscribe({
        next: (response) => {
          console.log('Direct API test successful:', response);
          this.showSnackBar('API test successful');
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Direct API test failed:', err);
          this.showSnackBar('API test failed: ' + (err.message || 'Unknown error'));
          this.isLoading = false;
        }
      });
  }
}
