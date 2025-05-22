import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  manualToken = '';
  loading = false;
  error = '';
  showTokenInput = false;
  returnUrl: string = '/';

  constructor(
    private auth: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}
  ngOnInit() {
    // Get return URL from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // Check if already logged in
    if (this.auth.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
    }

    // For development: check if manual token exists in window object
    if ((window as any).manualToken) {
      this.manualToken = (window as any).manualToken;
      this.handleManualToken();
    }
  }
  onSubmit() {
    if (this.showTokenInput && this.manualToken) {
      this.handleManualToken();
      return;
    }

    this.loading = true;
    this.error = '';
    
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Đăng nhập thất bại';
      }
    });
  }
  handleManualToken() {
    this.loading = true;
    this.error = '';
    
    this.auth.setManualToken(this.manualToken).subscribe(success => {
      this.loading = false;
      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error = 'Token không hợp lệ';
      }
    });
  }

  toggleTokenInput() {
    this.showTokenInput = !this.showTokenInput;
    this.error = '';
  }
}
