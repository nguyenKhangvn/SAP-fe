import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { AuthService } from './services/auth.service'; // Assuming this path is correct

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatSidenav;
  isExpanded = true;
  isMobile = false;
  screenWidth!: number;

  dashboardItems = [
    { label: 'Thống Kê', icon: 'bar_chart', route: '/dashboard' }, // Changed to material icon names
    { label: 'Danh Sách Đơn Hàng', icon: 'list_alt', route: '/order-list' },
    { label: 'Đặt Hàng', icon: 'receipt', route: '/order' },
    { label: 'Sản Phẩm', icon: 'inventory_2', route: '/products' },
    { label: 'Tồn Kho', icon: 'warehouse', route: '/stock' },
    { label: 'Khách Hàng', icon: 'people', route: '/customers' },
    { label: 'Công Nợ', icon: 'payments', route: '/payments' },
    { label: 'Đăng Xuất', icon: 'exit_to_app', route: '/logout' }, // Consistent material icon for logout
  ];

  constructor(private router: Router, public authService: AuthService) {
    // Retrieve saved sidebar state only if a user is logged in
    if (this.authService.isLoggedIn()) {
      const savedState = localStorage.getItem('sidebarExpanded');
      if (savedState !== null) {
        this.isExpanded = savedState === 'true';
      }
    }
    this.onResize(); // Initial check for screen size
  }

  ngOnInit() {
    // No specific initialization needed here beyond constructor
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?: any) {
    this.screenWidth = window.innerWidth;
    this.checkScreenSize();
    // Save sidebar state only if not mobile (mobile state handled in checkScreenSize)
    if (!this.isMobile) {
      localStorage.setItem('sidebarExpanded', this.isExpanded.toString());
    }
  }

  private checkScreenSize() {
    const wasMobile = this.isMobile;
    this.isMobile = this.screenWidth < 768; // Define your mobile breakpoint

    // If switching to mobile, collapse the sidebar
    if (this.isMobile && !wasMobile) {
      this.isExpanded = false;
      localStorage.setItem('sidebarExpanded', 'false');
    }
    // If switching from mobile to desktop, restore saved state or default to expanded
    else if (!this.isMobile && wasMobile) {
        const savedState = localStorage.getItem('sidebarExpanded');
        this.isExpanded = savedState === 'true';
    }
  }

  goTo(route: string) {
    if (route === '/logout') {
      this.logout();
    } else {
      this.router.navigate([route]);
    }
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.drawer.toggle();
    } else {
      this.isExpanded = !this.isExpanded;
      localStorage.setItem('sidebarExpanded', this.isExpanded.toString());
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        // Clear any local storage related to sidebar state on logout
        localStorage.removeItem('sidebarExpanded');
        // Navigate to login or home page after logout
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout failed:', err);
        // Handle error, e.g., show a message to the user
      }
    });
  }
}