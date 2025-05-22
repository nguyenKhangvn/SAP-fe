import { Component, Inject, OnInit, ViewChild, HostListener } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product, ProductService } from '../services/products.service';
import { ProductDialogComponent } from '../product-dialog/product-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  displayedColumns: string[] = ['code', 'name', 'costPrice', 'salePrice', 'actions'];
  dataSource = new MatTableDataSource<Product>([]);
  isLoading: boolean = false;
  isMobile: boolean = false;
  screenWidth: number = 0;

  constructor(
    private productService: ProductService,
    private dialog: MatDialog, 
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
    this.loadProducts();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadProducts() {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.dataSource.data = products;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading products', err);
        this.snackBar.open('Không thể tải danh sách sản phẩm', 'Đóng', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  openDialog(mode: 'add' | 'edit', product?: Product) {
    const productData = mode === 'add' ? 
      { code: '', name: '', costPrice: 0, salePrice: 0 } : 
      {...product};
    
    // Determine dialog width based on screen size  
    const dialogWidth = this.isMobile ? '95%' : '500px';
    
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: dialogWidth,
      maxWidth: '95vw',
      data: { mode, product: productData },
      panelClass: ['responsive-dialog', 'mat-elevation-z3']
    });


    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (mode === 'add') {
          this.productService.addProduct(result).subscribe({
            next: () => {
              this.snackBar.open('Thêm sản phẩm thành công', 'Đóng', { duration: 2000 });
              this.loadProducts();
            },
            error: (err) => {
              console.error('Error adding product', err);
              this.snackBar.open('Không thể thêm sản phẩm', 'Đóng', { duration: 3000 });
            }
          });
        } else {
          this.productService.updateProduct(result).subscribe({
            next: () => {
              this.snackBar.open('Cập nhật sản phẩm thành công', 'Đóng', { duration: 2000 });
              this.loadProducts();
            },
            error: (err) => {
              console.error('Error updating product', err);
              this.snackBar.open('Không thể cập nhật sản phẩm', 'Đóng', { duration: 3000 });
            }
          });
        }
      }
    });
  }

  deleteProduct(product: Product) {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      this.productService.deleteProduct(product._id!).subscribe({
        next: () => {
          this.snackBar.open('Đã xóa sản phẩm', 'Đóng', { duration: 2000 });
          this.loadProducts();
        },
        error: (err) => {
          console.error('Error deleting product', err);
          this.snackBar.open('Không thể xóa sản phẩm', 'Đóng', { duration: 3000 });
        }
      });
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}