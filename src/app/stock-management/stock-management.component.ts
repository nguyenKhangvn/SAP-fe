import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService, Product, StockHistory } from '../services/products.service';

@Component({
  selector: 'app-stock-management',
  templateUrl: './stock-management.component.html',
  styleUrls: ['./stock-management.component.css']
})
export class StockManagementComponent implements OnInit {
  stockForm!: FormGroup;
  products: Product[] = [];
  stockHistory: StockHistory[] = [];
  selectedProduct: Product | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();
  }

  initForm(): void {
    this.stockForm = this.fb.group({
      productCode: ['', Validators.required],
      type: ['import', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      notes: ['']
    });

    // Listen for product selection changes
    this.stockForm.get('productCode')?.valueChanges.subscribe(code => {
      if (code) {
        this.selectedProduct = this.products.find(p => p.code === code) || null;
        this.loadStockHistory(code);
      } else {
        this.selectedProduct = null;
        this.stockHistory = [];
      }
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading products', err);
        this.snackBar.open('Không thể tải danh sách sản phẩm', 'Đóng', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadStockHistory(productCode: string): void {
    this.isLoading = true;
    this.productService.getStockHistory(productCode).subscribe({
      next: (history) => {
        this.stockHistory = history || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading stock history', err);
        this.stockHistory = []; // Reset to empty array on error
        this.snackBar.open('Không thể tải lịch sử tồn kho', 'Đóng', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.stockForm.valid) {
      const { productCode, type, quantity, notes } = this.stockForm.value;
      
      this.isLoading = true;
      this.productService.updateStock(productCode, type, quantity, notes).subscribe({
        next: (response) => {
          const actionType = type === 'import' ? 'nhập' : 'xuất';
          this.snackBar.open(`Đã ${actionType} ${quantity} sản phẩm thành công`, 'Đóng', { duration: 2000 });
          this.loadStockHistory(productCode);
          this.loadProducts(); // Reload products to get updated stock levels
          this.stockForm.patchValue({ quantity: 1, notes: '' });
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error updating stock', err);
          this.snackBar.open('Không thể cập nhật tồn kho', 'Đóng', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  getStockStatusClass(currentStock: number): string {
    if (currentStock <= 0) {
      return 'out-of-stock';
    } else if (currentStock < 10) {
      return 'low-stock';
    } else {
      return 'in-stock';
    }
  }
}
