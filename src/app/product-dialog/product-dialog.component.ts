import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Product } from '../services/products.service';


@Component({
  selector: 'app-product-dialog',
  templateUrl: './product-dialog.component.html',
  styleUrls: ['./product-dialog.component.css']
})
export class ProductDialogComponent {
  productForm: FormGroup;
  dialogTitle: string;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'add' | 'edit', product: Product }
  ) {
    this.dialogTitle = data.mode === 'add' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm';
    
    this.productForm = this.fb.group({
      _id: [data.product._id],
      code: [data.product.code || this.generateRandomCode(), [Validators.required]],
      name: [data.product.name, [Validators.required]],
      costPrice: [data.product.costPrice || 10000000, [Validators.required, Validators.min(0)]],
      salePrice: [data.product.salePrice || 10000000, [Validators.required, Validators.min(0)]]
    });
  }
  private generateRandomCode(): string {
    return 'SP-' + Math.floor(100000 + Math.random() * 900000);
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      // Convert string values with commas to numbers before submitting
      const formValues = this.productForm.value;
      
      // Handle masked input values
      if (typeof formValues.costPrice === 'string') {
        formValues.costPrice = Number(formValues.costPrice.replace(/,/g, ''));
      }
      
      if (typeof formValues.salePrice === 'string') {
        formValues.salePrice = Number(formValues.salePrice.replace(/,/g, ''));
      }
      
      this.dialogRef.close(formValues);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}