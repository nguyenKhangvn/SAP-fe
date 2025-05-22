import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DashboardService, DashboardStats, InventoryStats, CustomerStats } from '../services/dashboard.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  // Chart references
  @ViewChild('salesChart') salesChartRef!: ElementRef;
  @ViewChild('orderStatusChart') orderStatusChartRef!: ElementRef;
  @ViewChild('topProductsChart') topProductsChartRef!: ElementRef;
  @ViewChild('topCustomersChart') topCustomersChartRef!: ElementRef;

  // Data properties
  stats!: DashboardStats;
  inventory!: InventoryStats;
  customers!: CustomerStats;
  isLoading = true;
  error: string | null = null;

  // Chart instances
  salesChart: Chart | null = null;
  orderStatusChart: Chart | null = null;
  topProductsChart: Chart | null = null;
  topCustomersChart: Chart | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.dashboardService.getAllDashboardData().subscribe({
      next: (data) => {
        this.stats = data.stats;
        this.inventory = data.inventory;
        this.customers = data.customers;
        this.isLoading = false;

        setTimeout(() => {
          this.initializeCharts();
        }, 100);
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
        this.error = 'Không thể tải dữ liệu dashboard';
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

  initializeCharts(): void {
    this.initSalesChart();
    this.initOrderStatusChart();
    this.initTopProductsChart();
    this.initTopCustomersChart();
  }

  initSalesChart(): void {
    if (this.salesChartRef && this.salesChartRef.nativeElement && this.stats) {
      const ctx = this.salesChartRef.nativeElement.getContext('2d');
      
      if (this.salesChart) {
        this.salesChart.destroy();
      }
      
      const data = this.stats.salesOverTime;
      
      this.salesChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('vi-VN');
          }),
          datasets: [
            {
              label: 'Doanh thu (VND)',
              data: data.map(item => item.revenue),
              borderColor: '#4e73df',
              backgroundColor: 'rgba(78, 115, 223, 0.05)',
              tension: 0.3,
              fill: true
            },
            {
              label: 'Số đơn hàng',
              data: data.map(item => item.orderCount),
              borderColor: '#1cc88a',
              backgroundColor: 'transparent',
              borderDash: [5, 5],
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Doanh thu theo thời gian (7 ngày gần đây)'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y;
                  if (label.includes('Doanh thu')) {
                    return `${label}: ${this.formatCurrency(value)}`;
                  }
                  return `${label}: ${value}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => {
                  if (typeof value === 'number' && value >= 1000000) {
                    return `${value / 1000000}M`;
                  }
                  return value;
                }
              }
            }
          }
        }
      });
    }
  }

  initOrderStatusChart(): void {
    if (this.orderStatusChartRef && this.orderStatusChartRef.nativeElement && this.stats) {
      const ctx = this.orderStatusChartRef.nativeElement.getContext('2d');
      
      if (this.orderStatusChart) {
        this.orderStatusChart.destroy();
      }
      
      const ordersByStatus = {
          paid: this.stats.allOrders.filter(o => o.isPaid === true).length,
          unpaid: this.stats.allOrders.filter(o => o.isPaid === false).length
      };
      console.log('Orders by status:', ordersByStatus);
      this.stats.ordersByStatus = ordersByStatus;
      this.orderStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Đã thanh toán', 'Còn nợ'],
          datasets: [{
            data: [ordersByStatus.paid, ordersByStatus.unpaid],
            
            backgroundColor: ['#1cc88a', '#e74a3b'],
            hoverBackgroundColor: ['#17a673', '#d52a1a'],
            hoverBorderColor: 'rgba(234, 236, 244, 1)',
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: 'Trạng thái đơn hàng'
            }
          },
          cutout: '70%'
        }
      });
    }
  }

  initTopProductsChart(): void {
    if (this.topProductsChartRef && this.topProductsChartRef.nativeElement && this.stats) {
      const ctx = this.topProductsChartRef.nativeElement.getContext('2d');
      
      if (this.topProductsChart) {
        this.topProductsChart.destroy();
      }
      
      const topProducts = this.stats.topProducts;
      console.log('Top products:', topProducts.map(item => item.name));
      
      this.topProductsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: topProducts.map(item => item.name),
          datasets: [{
            label: 'Số lượng bán ra',
            data: topProducts.map(item => item.totalQuantity),
            backgroundColor: '#36b9cc',
            hoverBackgroundColor: '#2c9faf',
            borderWidth: 0
          }],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Sản phẩm bán chạy'
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
    }
  }

  initTopCustomersChart(): void {
    if (this.topCustomersChartRef && this.topCustomersChartRef.nativeElement && this.customers) {
      const ctx = this.topCustomersChartRef.nativeElement.getContext('2d');
      
      if (this.topCustomersChart) {
        this.topCustomersChart.destroy();
      }
      
      const topCustomers = this.customers.topCustomers;
      
      this.topCustomersChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: topCustomers.map(item => item.name),
          datasets: [{
            label: 'Tổng chi tiêu (VND)',
            data: topCustomers.map(item => item.totalSpent),
            backgroundColor: '#f6c23e',
            hoverBackgroundColor: '#e0a800',
            borderWidth: 0
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Khách hàng hàng đầu'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.parsed.x;
                  return `${label}: ${this.formatCurrency(value)}`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: (value) => {
                  if (typeof value === 'number' && value >= 1000000) {
                    return `${value / 1000000}M`;
                  }
                  return value;
                }
              }
            }
          }
        }
      });
    }
  }
}
