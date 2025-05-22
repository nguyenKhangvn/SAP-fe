import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms'; // Added AbstractControl for clarity
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar'; // Import MatSnackBar
import { Customer, CustomerService } from '../services/customers.service';
import { Order, OrderService } from '../services/order.service';
import { Observable, of } from 'rxjs'; // For 'of' in catchError example (though not used directly in this snippet)

@Component({
  selector: 'app-payment-dialog',
  templateUrl: './payment-dialog.component.html',
  styleUrls: ['./payment-dialog.component.css', './print-styles.css']
})
export class PaymentDialogComponent implements OnInit {
  paymentForm!: FormGroup;
  customers: Customer[] = [];
  orders: Order[] = [];
  dialogMode: string = 'add';
  dialogTitle: string = '';
  // Removed selectedOrders property, as it's managed by FormArray now

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private orderService: OrderService, // Assuming this is used elsewhere, not directly in this dialog for batch payments
    public dialogRef: MatDialogRef<PaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar // Inject MatSnackBar
  ) {
    this.dialogMode = data?.mode || 'add';
  }

  ngOnInit(): void {
    this.setDialogTitle();

    if (this.dialogMode === 'view-debt' || this.dialogMode === 'confirm-delete' || this.dialogMode === 'payment-success') {
      return;
    }

    if (this.dialogMode === 'pay-debt') {
      this.initDebtPaymentForm();
    } else if (this.dialogMode === 'batch-payment') {
      this.initBatchPaymentForm();
    } else {
      this.initPaymentForm();
    }

    if (['add', 'edit'].includes(this.dialogMode)) {
      this.loadCustomers();
      this.loadOrders();
    }
  }
   get selectedOrderCount(): number {
    if (this.dialogMode !== 'batch-payment' || !this.orderFormArray) {
      return 0;
    }
    return this.orderFormArray.controls.filter(control => control.get('selected')?.value).length;
  }

  private setDialogTitle(): void {
    switch (this.dialogMode) {
      case 'add':
        this.dialogTitle = this.data?.type === 'payment' ? 'Tạo phiếu thu' : 'Tạo phiếu chi';
        break;
      case 'edit':
        this.dialogTitle = this.data?.type === 'payment' ? 'Chỉnh sửa phiếu thu' : 'Chỉnh sửa phiếu chi';
        break;
      case 'view-debt':
        this.dialogTitle = 'Chi tiết công nợ';
        if (this.data?.debtDetails) {
          // this.data.debtDetails.startDate = this.data.debtDetails.startDate || new Date().toISOString();
          // this.data.debtDetails.endDate = this.data.debtDetails.endDate || new Date().toISOString();
          this.data.debtDetails.orders = this.data.debtDetails.orders || [];
          this.data.debtDetails.summary = this.data.debtDetails.summary || {
              totalOrders: 0,
              totalOrderValue: 0,
              totalPaid: 0,
              totalRemainingDebt: 0
          };
        }
        break;
      case 'pay-debt':
        this.dialogTitle = 'Thanh toán công nợ';
        break;
      case 'batch-payment':
        this.dialogTitle = 'Thanh toán nhiều đơn hàng';
        break;
      case 'payment-success':
        this.dialogTitle = 'Thanh toán thành công';
        break;
      case 'confirm-delete':
        this.dialogTitle = 'Xác nhận xóa';
        break;
      default:
        this.dialogTitle = 'Phiếu thanh toán';
    }
  }

  onOrderSelectionChange(): void {
    this.updateTotalAmount();
  }

  private initPaymentForm(): void {
    const paymentData = this.data?.payment || {};

    this.paymentForm = this.fb.group({
      _id: [paymentData._id || null],
      customerId: [paymentData.customerId || '', Validators.required],
      amount: [paymentData.amount || 0, [Validators.required, Validators.min(0)]],
      date: [paymentData.date ? new Date(paymentData.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10), Validators.required],
      type: [paymentData.type || this.data?.type || 'payment', Validators.required],
      note: [paymentData.note || ''],
      orderId: [paymentData.orderId || null]
    });
  }

  private initDebtPaymentForm(): void {
    const customer = this.data?.customer || {};

    this.paymentForm = this.fb.group({
      customerId: [customer.customerId || '', Validators.required],
      amount: [customer.remainingDebt || 0, [Validators.required, Validators.min(0), Validators.max(customer.remainingDebt || 0)]],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      type: ['payment', Validators.required],
      note: [`Thanh toán công nợ - ${customer.customerName || ''}`],
      isDebtPayment: [true],
      paymentMethod: ['cash', Validators.required]
    });
  }

  private initBatchPaymentForm(): void {
    const customer = this.data?.customer || {};
    const ordersData = this.data?.orders || []; // Get orders from data

    this.paymentForm = this.fb.group({
      customerId: [customer.customerId || '', Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0)]], // Initialize to 0, updated by updateTotalAmount
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      paymentMethod: ['cash', Validators.required],
      note: [`Thanh toán đơn hàng - ${customer.customerName || ''}`],
      selectedOrders: this.fb.array(ordersData.map((order: any) => this.createOrderFormGroup(order)))
    });

    // Initial calculation after form array is populated
    this.updateTotalAmount();
  }

  private createOrderFormGroup(order: any): FormGroup {
    return this.fb.group({
      orderId: [order.orderId],
      orderCode: [order.orderCode],
      remaining: [order.remaining],
      payAmount: [order.remaining, [Validators.required, Validators.min(0), Validators.max(order.remaining)]],
      selected: [true] // Default to selected
    });
  }

  get orderFormArray(): FormArray {
    return this.paymentForm.get('selectedOrders') as FormArray;
  }

  private loadCustomers(): void {
    this.customerService.getCustomers().subscribe(customers => {
      this.customers = customers;
    });
  }
  private loadOrders(): void {
    this.orderService.getAllOrders().subscribe(orders => {
      this.orders = orders;
    });
  }

  onSubmit(): void {
    console.log('Submit button clicked, form valid:', this.paymentForm?.valid);

    // Add this snackbar check
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched(); // Show validation errors
      this.showSnackBar('Vui lòng điền đầy đủ và đúng thông tin.');
      return;
    }

    if (this.dialogMode === 'batch-payment') {
      const formValue = this.paymentForm.value;

      // Filter and map only selected orders with a positive payAmount
      const selectedPayments = formValue.selectedOrders
        .filter((orderControl: any) => orderControl.selected && orderControl.payAmount > 0)
        .map((orderControl: any) => ({
          orderId: orderControl.orderId,
          amount: orderControl.payAmount,
          note: formValue.note,
          paymentMethod: formValue.paymentMethod,
          date: formValue.date
          // Assuming 'type' is 'payment' for all debt payments to backend
        }));

      if (selectedPayments.length === 0) {
        this.showSnackBar('Vui lòng chọn ít nhất một đơn hàng để thanh toán và nhập số tiền lớn hơn 0.');
        return; // Prevent closing dialog if no payments selected
      }

      const batchPaymentData = {
        customerId: this.data.customer.customerId, // Get from data.customer
        customerName: this.data.customer.customerName, // Get from data.customer
        totalAmount: formValue.totalAmount,
        date: formValue.date,
        paymentMethod: formValue.paymentMethod,
        note: formValue.note,
        payments: selectedPayments // This is the array of individual order payments
      };

      console.log('Submitting batch payment data:', batchPaymentData);
      this.dialogRef.close(batchPaymentData);

    } else { // Handle other modes (add, edit, pay-debt)
      let formValue = this.paymentForm.value;

      // Ensure amount is a number if it comes as string (e.g., from formatted input)
      if (formValue.amount && typeof formValue.amount === 'string') {
        formValue.amount = parseFloat(formValue.amount.replace(/[^\d.-]/g, ''));
      }

      // Ensure customerId is properly formatted if it was an object (e.g., from mat-autocomplete)
      if (formValue.customerId && typeof formValue.customerId === 'object' && formValue.customerId._id) {
        formValue.customerId = formValue.customerId._id;
      }

      // Ensure orderId is properly formatted
      if (formValue.orderId && typeof formValue.orderId === 'object' && formValue.orderId._id) {
        formValue.orderId = formValue.orderId._id;
      }

      // Special handling for debt payment (already done in init, just ensure consistency)
      if (this.dialogMode === 'pay-debt' && this.data && this.data.customer) {
        formValue.customerId = this.data.customer.customerId;
        formValue.customerName = this.data.customer.customerName;
        formValue.type = 'payment';
      }

      console.log('Submitting form data:', formValue);
      this.dialogRef.close(formValue);
    }
  }

  // Update total amount based on individual order payment amounts and selection
  updateTotalAmount(): void {
    if (this.dialogMode !== 'batch-payment') return; // Only apply for batch payment mode

    const orderControls = this.orderFormArray.controls;
    const totalAmount = orderControls.reduce((sum: number, control: AbstractControl) => {
      const isSelected = control.get('selected')?.value;
      const payAmount = Number(control.get('payAmount')?.value || 0); // Ensure it's a number

      return sum + (isSelected ? payAmount : 0);
    }, 0);

    this.paymentForm.get('totalAmount')?.setValue(totalAmount, { emitEvent: false }); // Update totalAmount without triggering valueChanges
  }

  close(): void {
    this.dialogRef.close();
  }

  confirmDelete(): void {
    this.dialogRef.close(true);
  }

  printDebtDetails(): void {
    const printContents = this.preparePrintContent();
    const originalContents = document.body.innerHTML;
    const originalTitle = document.title;
    document.title = 'Yến sào trầm hương Hoàng Gia Quy Nhơn';

    // Create print window
    document.body.innerHTML = printContents;

    window.print();

    // Restore original content
    document.body.innerHTML = originalContents;
  }

  private preparePrintContent(): string {
    if (!this.data?.debtDetails) {
      return '';
    }

    const details = this.data.debtDetails;
    const today = new Date().toLocaleDateString('vi-VN');

    const startDate = details.startDate ? new Date(details.startDate).toLocaleDateString('vi-VN') : '';
    const endDate = details.endDate ? new Date(details.endDate).toLocaleDateString('vi-VN') : today;

    let content = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin-bottom: 5px;">BÁO CÁO CÔNG NỢ CHI TIẾT</h2>
          <p>Ngày xuất: ${today}</p>
        </div>

        <div style="margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
          <h3>Thông tin khách hàng</h3>
          <p><strong>Tên khách hàng:</strong> ${details.customerName}</p>
          <p><strong>Tổng công nợ:</strong> ${this.formatCurrency(details.totalDebt)} VND</p>
          <p><strong>Thời gian:</strong> ${endDate}</p>
        </div>
    `;

    if (details.orders && details.orders.length > 0) {
      content += `
        <h3>Chi tiết đơn hàng chưa thanh toán đủ</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Mã đơn hàng</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Ngày đặt</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Tổng đơn hàng</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Đã thanh toán</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Còn nợ</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Thanh toán gần nhất</th>
            </tr>
          </thead>
          <tbody>
      `;

      details.orders.forEach((order: any) => {
        const lastPaymentDate = order.lastPaymentDate
          ? new Date(order.lastPaymentDate).toLocaleDateString('vi-VN')
          : 'Chưa có';

        content += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${order.orderCode}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${new Date(order.orderDate).toLocaleDateString('vi-VN')}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${this.formatCurrency(order.total)}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${this.formatCurrency(order.paid)}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: #f44336;">${this.formatCurrency(order.remaining)}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${lastPaymentDate}</td>
          </tr>
        `;
      });

      content += `
          </tbody>
        </table>
      `;
    } else {
      content += `<p>Không có đơn hàng nào còn nợ</p>`;
    }

    content += `
        <div style="margin-top: 30px; text-align: right;">
          <p><strong>Tổng công nợ:</strong> <span style="color: #f44336;">${this.formatCurrency(details.totalDebt)} VND</span></p>
        </div>

        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
          <div style="width: 45%; text-align: center;">
            <p>Người lập báo cáo</p>
            <p style="margin-top: 60px;">(Ký và ghi rõ họ tên)</p>
          </div>
          <div style="width: 45%; text-align: center;">
            <p>Khách hàng</p>
            <p style="margin-top: 60px;">(Ký và ghi rõ họ tên)</p>
          </div>
        </div>
      </div>
    `;

    return content;
  }

  private formatCurrency(amount: number | undefined | null): string {
    if (amount === undefined || amount === null) {
      return '0';
    }
    try {
      return new Intl.NumberFormat('vi-VN').format(amount);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return '0';
    }
  }

  getPaymentMethodText(method: string): string {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'bank': return 'Chuyển khoản';
      // case 'card': return 'Thẻ'; // Uncomment if you have 'card' method
      default: return 'Không xác định';
    }
  }

  private showSnackBar(message: string, action: string = 'Đóng'): void {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}