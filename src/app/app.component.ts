import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';

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
    { label: 'Thống Kê', icon: '📊', route: '/dashboard' },
    { label: 'Danh Sách Đơn Hàng', icon: '📝', route: '/order-list' },
    { label: 'Đặt Hàng', icon: '🧾', route: '/order' },
    { label: 'Sản Phẩm', icon: '📦', route: '/products' },
    { label: 'Tồn Kho', icon: '🧮', route: '/stock' },
    { label: 'Khách Hàng', icon: '👥', route: '/customers' },
    { label: 'Công Nợ', icon: '💰', route: '/payments' },
    // { label: 'Báo Cáo', icon: '📈', route: '/report' }
  ];

  constructor(private router: Router) {
    // Load sidebar state from localStorage
    const savedState = localStorage.getItem('sidebarExpanded');
    if (savedState !== null) {
      this.isExpanded = savedState === 'true';
    }
    this.onResize();
  }

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?: any) {
    this.screenWidth = window.innerWidth;
    this.checkScreenSize();
    // Save sidebar state after screen size check
    localStorage.setItem('sidebarExpanded', this.isExpanded.toString());
  }

  private checkScreenSize() {
    this.isMobile = this.screenWidth < 768;
    if (this.isMobile) {
      this.isExpanded = false;
      // Save sidebar state to localStorage
      localStorage.setItem('sidebarExpanded', 'false');
    }
  }

  goTo(route: string) {
    this.router.navigate([route]);
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.drawer.toggle();
      console.log('Toggled sidebar on mobile');
    } else {
      this.isExpanded = !this.isExpanded;
      // Save sidebar state to localStorage
      localStorage.setItem('sidebarExpanded', this.isExpanded.toString());
    }
  }
}
