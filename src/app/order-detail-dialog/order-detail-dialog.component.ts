import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OrderService } from '../services/order.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerService } from '../services/customers.service';
import { ProductService } from '../services/products.service';

@Component({
  selector: 'app-order-detail-dialog',
  templateUrl: './order-detail-dialog.component.html',
  styleUrls: ['./order-detail-dialog.component.css']
})
export class OrderDetailDialogComponent implements OnInit {
  order: any;
  products: any[] = []; // Initialize as empty array to prevent undefined errors
  displayedColumns: string[] = ['code', 'name', 'quantity', 'price', 'subtotal', 'profit'];
  isLoading = false;
  isLoadingProducts = false;
  isSaving = false;
  editMode = false;
  
  // Form properties
  orderForm!: FormGroup;
  customers: any[] = [];
  productsList: any[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<OrderDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orderId: string, editMode?: boolean },
    private orderService: OrderService,
    private customerService: CustomerService,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {
    this.editMode = data.editMode || false;
  }

  ngOnInit(): void {
    this.loadOrderDetails();
    if (this.editMode) {
      this.loadCustomers();
      this.loadProducts();
    }
  }

  loadOrderDetails(): void {
    this.isLoading = true;
    this.orderService.getOrderById(this.data.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;
        // After loading order details, load products
        this.loadOrderProducts();
        
        if (this.editMode) {
          this.initOrderForm();
        }
      },
      error: (err) => {
        console.error('Error loading order details:', err);
        this.isLoading = false;
      }
    });
  }
  
  loadOrderProducts(): void {
    this.isLoadingProducts = true;
    this.orderService.getOrderProducts(this.data.orderId).subscribe({
      next: (response) => {
        this.products = response.products || [];
        this.isLoadingProducts = false;
        
        if (this.editMode) {
          this.populateItemsFormArray();
        }
      },
      error: (err) => {
        console.error('Error loading order products:', err);
        this.isLoadingProducts = false;
      }
    });
  }
  
  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.showSnackBar('Không thể tải danh sách khách hàng');
      }
    });
  }
  
  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.productsList = products;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.showSnackBar('Không thể tải danh sách sản phẩm');
      }
    });
  }

  initOrderForm(): void {
    this.orderForm = this.fb.group({
      orderCode: [this.order.orderCode, Validators.required],
      customerId: [this.order.customer ? this.order.customer._id : this.order.customerId, Validators.required],
      status: [this.order.status || 'paid', Validators.required],
      items: this.fb.array([]),
      total: [this.order.total, [Validators.required, Validators.min(0)]]
    });
  }
  
  populateItemsFormArray(): void {
    const itemsFormArray = this.orderForm.get('items') as FormArray;
    
    // Clear existing items
    while (itemsFormArray.length) {
      itemsFormArray.removeAt(0);
    }
    
    // Add form groups for each product
    if (this.products && this.products.length) {
      this.products.forEach(product => {
        itemsFormArray.push(this.createItemFormGroup({
          productCode: product.productCode,
          quantity: product.quantity,
          price: product.price
        }));
      });
    } else {
      // Add an empty item if no products are available
      this.addItem();
    }
  }
  
  createItemFormGroup(item: any = { productCode: '', quantity: 1, price: 0 }): FormGroup {
    return this.fb.group({
      productCode: [item.productCode, Validators.required],
      quantity: [item.quantity, [Validators.required, Validators.min(1)]],
      price: [item.price, [Validators.required, Validators.min(0)]]
    });
  }
  
  get itemsFormArray(): FormArray {
    return this.orderForm.get('items') as FormArray;
  }
  
  addItem(): void {
    this.itemsFormArray.push(this.createItemFormGroup());
  }
  
  removeItem(index: number): void {
    this.itemsFormArray.removeAt(index);
    this.calculateTotal();
  }
    onProductChange(index: number): void {
    const item = this.itemsFormArray.at(index) as FormGroup;
    const productCode = item.get('productCode')?.value;
    if (productCode) {
      const product = this.productsList.find(p => p.code === productCode);
      if (product) {
        item.get('price')?.setValue(product.salePrice || product.price || 0);
      }
    }
    this.calculateTotal();
  }
  
  calculateTotal(): void {
    let total = 0;
    const items = this.itemsFormArray.controls;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as FormGroup;
      const price = item.get('price')?.value || 0;
      const quantity = item.get('quantity')?.value || 0;
      total += price * quantity;
    }
    
    this.orderForm.get('total')?.setValue(total);
  }
  
  saveChanges(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      this.showSnackBar('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    this.isSaving = true;
    const orderData = this.orderForm.value;
    
    this.orderService.updateOrder(this.data.orderId, orderData).subscribe({
      next: (result) => {
        this.isSaving = false;
        this.showSnackBar('Cập nhật đơn hàng thành công');
        this.safeCloseWithResult({ success: true, data: result });
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error updating order:', err);
        this.showSnackBar('Lỗi khi cập nhật đơn hàng');
      }
    });
  }
  
  toggleEditMode(): void {
    this.editMode = !this.editMode;
    
    if (this.editMode) {
      // When entering edit mode, make sure we have necessary data
      if (!this.customers.length) this.loadCustomers();
      if (!this.productsList.length) this.loadProducts();
      this.initOrderForm();
      this.populateItemsFormArray();
    }
  }
  
  showSnackBar(message: string): void {
    this.snackBar.open(message, 'Đóng', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  close(): void {
    this.safeCloseWithResult();
  }

  // Helper method to safely close dialog with a result
  private safeCloseWithResult(result?: any): void {
    // First, clean up all aria-hidden attributes that might have been set on app-root
    const appRoot = document.querySelector('app-root');
    if (appRoot && appRoot.hasAttribute('aria-hidden')) {
      appRoot.removeAttribute('aria-hidden');
    }
    
    // Then, clean up any aria-hidden attributes on ancestors of focused elements
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      // Blur the active element first
      activeElement.blur();
      
      // Find all ancestors with aria-hidden and clean them
      let ancestor = activeElement.parentElement;
      while (ancestor) {
        if (ancestor.hasAttribute('aria-hidden')) {
          ancestor.removeAttribute('aria-hidden');
        }
        ancestor = ancestor.parentElement;
      }
      
      // Move focus to a safe element (document.body) before closing
      document.body.focus();
    }
    
    // Close dialog with result after a small delay to ensure cleanup is complete
    setTimeout(() => {
      this.dialogRef.close(result);
    }, 0);
  }

  formatCurrency(value: number): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
