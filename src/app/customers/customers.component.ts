import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Customer, CustomerService } from '../services/customers.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  customers: Customer[] = [];
  currentCustomer: any = { name: '', phone: '', note: '' };
  editingCustomer: boolean = false;
  searchTerm: string = '';
  currentPage: number = 1;
  totalPages: number = 1;
  pageSize: number = 10;
  totalCustomers: number = 0;
  displayedColumns: string[] = ['name', 'phone', 'note', 'actions'];
  isLoading: boolean = false;
  isMobile: boolean = false;
  screenWidth: number = 0;

  constructor(
    private customerService: CustomerService,
    private snackBar: MatSnackBar
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
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.customerService.getCustomersToPage(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.customers = response.items;
          this.totalCustomers = response.total;
          this.totalPages = response.totalPages;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Lỗi khi tải danh sách khách hàng:', error);
          this.snackBar.open('Không thể tải danh sách khách hàng', 'Đóng', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      });
  }

  saveCustomer(): void {
    if (!this.currentCustomer.name) {
      this.snackBar.open('Vui lòng nhập tên khách hàng', 'Đóng', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading = true;
    if (this.editingCustomer) {
      this.customerService.updateCustomer(this.currentCustomer._id, this.currentCustomer)
        .subscribe({
          next: () => {
            this.loadCustomers();
            this.resetForm();
            this.snackBar.open('Đã cập nhật khách hàng thành công', 'Đóng', {
              duration: 3000
            });
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Lỗi khi cập nhật khách hàng:', error);
            this.snackBar.open('Không thể cập nhật khách hàng', 'Đóng', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            this.isLoading = false;
          }
        });
    } else {
      this.customerService.addCustomer(this.currentCustomer)
        .subscribe({
          next: () => {
            this.loadCustomers();
            this.resetForm();
            this.snackBar.open('Đã thêm khách hàng mới thành công', 'Đóng', {
              duration: 3000
            });
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Lỗi khi thêm khách hàng:', error);
            this.snackBar.open('Không thể thêm khách hàng mới', 'Đóng', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            this.isLoading = false;
          }
        });
    }
  }

  editCustomer(customer: any): void {
    this.currentCustomer = { ...customer };
    this.editingCustomer = true;
    
    // Scroll to the form section
    const formElement = document.querySelector('.form-card');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  deleteCustomer(id: string): void {
    if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      this.isLoading = true;
      this.customerService.deleteCustomer(id)
        .subscribe({
          next: () => {
            this.loadCustomers();
            this.snackBar.open('Đã xóa khách hàng thành công', 'Đóng', {
              duration: 3000
            });
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Lỗi khi xóa khách hàng:', error);
            this.snackBar.open('Không thể xóa khách hàng', 'Đóng', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            this.isLoading = false;
          }
        });
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.currentCustomer = { name: '', phone: '', note: '' };
    this.editingCustomer = false;
  }

  searchCustomers(): void {
    this.currentPage = 1;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadCustomers();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex + 1;
    this.loadCustomers();
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
