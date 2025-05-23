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
  @ViewChild('profitChart') profitChartRef!: ElementRef;

  // Data properties
  stats!: DashboardStats;
  inventory!: InventoryStats;
  customers!: CustomerStats;
  isLoading = true;
  error: string | null = null;
  
  // Dashboard controls
  selectedTimeRange = 'month'; // Default to 30 days
  salesChartType = 'line'; // Default to line chart
  profitChartType = 'line'; // Default to line chart
  
  // Trend indicators
  ordersTrend = 0;
  customersTrend = 0;
  productsTrend = 0;
  revenueTrend = 0;
  profitTrend = 0;

  // Chart instances
  salesChart: Chart | null = null;
  orderStatusChart: Chart | null = null;
  topProductsChart: Chart | null = null;
  topCustomersChart: Chart | null = null;
  profitChart: Chart | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    // Charts will be initialized after data is loaded
  }

  loadDashboardData() {
    this.isLoading = true;
    this.error = null;
    
    // For demonstration purposes, let's directly use the submitted data from the prompt
    // In production, this would come from this.dashboardService.getDashboardData(this.selectedTimeRange)
    
    // Sample recent orders data
    const recentOrdersData = [
      {
        _id: '682ff2116a05349036c1d1e3',
        orderCode: 'ORD-1747971400165',
        date: '2025-05-23T03:57:05.575Z',
        customerId: {
          _id: '682da56e161ceaa173f6e19b',
          name: 'Lộc'
        },
        total: 1400000,
        isPaid: false,
        status: 'debt'
      },
      {
        _id: '682ff1a0dbf04561b1a8cdf2',
        orderCode: 'ORD-1747971400164',
        date: '2025-05-23T03:55:12.766Z',
        customerId: {
          _id: '682da56e161ceaa173f6e19b',
          name: 'Lộc'
        },
        total: 1300000,
        isPaid: false,
        status: 'debt'
      },
      {
        _id: '682fed67545fd4d973d06290',
        orderCode: 'ORD-1747971400163',
        date: '2025-05-23T03:37:11.581Z',
        customerId: {
          _id: '682da56e161ceaa173f6e19b',
          name: 'Lộc'
        },
        total: 1200000,
        isPaid: false,
        status: 'debt'
      },
      {
        _id: '682fed47fcfe2ef79719fa0f',
        orderCode: 'ORD-1747971400162',
        date: '2025-05-23T03:36:39.665Z',
        customerId: {
          _id: '682da56e161ceaa173f6e19b',
          name: 'Lộc'
        },
        total: 1100000,
        isPaid: false,
        status: 'debt'
      },
      {
        _id: '682da5a5161ceaa173f6e1d4',
        orderCode: 'ORD-1747821988973',
        date: '2025-05-21T10:06:29.053Z',
        customerId: {
          _id: '682da56e161ceaa173f6e19b',
          name: 'Lộc'
        },
        total: 30000,
        isPaid: true,
        status: 'debt'
      }
    ];
    
    // Simulating API response with the provided data
    const mockResponse = {
      stats: {
        totalOrders: 15,
        totalCustomers: 4,
        totalProducts: 4,
        totalRevenue: 22798000,
        totalDebt: 9400000,
        totalProfit: 400000,
        paidOrdersCount: 2,
        debtOrdersCount: 13,
        ordersByStatus: { 'paid': 2, 'unpaid': 13 },
        recentOrders: this.formatOrders(recentOrdersData),
        allOrders: [], // Not needed for this demo
        topProducts: [
          { _id: 'SP-778881', totalQuantity: 30041, name: 'Đường Phèn' },
          { _id: '1', totalQuantity: 10, name: 'Yến Thô' },
          { _id: 'SP-899330', totalQuantity: 4, name: 'Bút chì' },
          { _id: '2', totalQuantity: 1, name: 'Tinh Chế' }
        ],
        salesOverTime: [
          { date: '2025-05-17', revenue: 0, orderCount: 0 },
          { date: '2025-05-18', revenue: 0, orderCount: 0 },
          { date: '2025-05-19', revenue: 0, orderCount: 0 },
          { date: '2025-05-20', revenue: 0, orderCount: 0 },
          { date: '2025-05-21', revenue: 17798000, orderCount: 11 },
          { date: '2025-05-22', revenue: 0, orderCount: 0 },
          { date: '2025-05-23', revenue: 5000000, orderCount: 4 }
        ]
      },
      inventory: {
        inventorySummary: [
          {
            productCode: '1',
            productName: 'Yến Thô',
            oldStock: 8,
            imported: 81,
            exported: 74,
            currentStock: 7,
            stockValue: 7000000,
            potentialSaleValue: 7700000
          },
          {
            productCode: '2',
            productName: 'Tinh Chế',
            oldStock: 15,
            imported: 20,
            exported: 6,
            currentStock: 14,
            stockValue: 140000000,
            potentialSaleValue: 140000000
          },
          {
            productCode: 'SP-778881',
            productName: 'Đường Phèn',
            oldStock: 9960,
            imported: 40000,
            exported: 30041,
            currentStock: 9959,
            stockValue: 248975000,
            potentialSaleValue: 298770000
          },
          {
            productCode: 'SP-899330',
            productName: 'Bút chì',
            oldStock: 7,
            imported: 10,
            exported: 4,
            currentStock: 6,
            stockValue: 6000,
            potentialSaleValue: 12000
          }
        ],
        lowStockProducts: [
          {
            productCode: '1',
            productName: 'Yến Thô',
            oldStock: 8,
            imported: 81,
            exported: 74,
            currentStock: 7,
            stockValue: 7000000,
            potentialSaleValue: 7700000
          },
          {
            productCode: 'SP-899330',
            productName: 'Bút chì',
            oldStock: 7,
            imported: 10,
            exported: 4,
            currentStock: 6,
            stockValue: 6000,
            potentialSaleValue: 12000
          }
        ],
        totalProductsInStock: 4,
        totalOutOfStock: 0,
        totalInventoryCostValue: 395981000,
        totalInventorySaleValue: 446482000
      },
      customers: {
        topCustomers: [
          {
            _id: '682c4a453bfa2fb7d98fa033',
            totalSpent: 15800000,
            orderCount: 6,
            name: 'b',
            averageOrderValue: 2633333.3333333335
          },
          {
            _id: '682da56e161ceaa173f6e19b',
            totalSpent: 5038000,
            orderCount: 7,
            name: 'Lộc',
            averageOrderValue: 719714.2857142857
          },
          {
            _id: '682a76efdbae5481384bc53a',
            totalSpent: 1960000,
            orderCount: 2,
            name: 'La A',
            averageOrderValue: 980000
          }
        ],
        newCustomers: 0,
        customersWithDebt: [
          {
            _id: '682da56e161ceaa173f6e19b',
            totalDebt: 5000000,
            name: 'Lộc',
            phone: ''
          },
          {
            _id: '682c4a453bfa2fb7d98fa033',
            totalDebt: 3400000,
            name: 'b',
            phone: '111'
          },
          {
            _id: '682a76efdbae5481384bc53a',
            totalDebt: 1000000,
            name: 'La A',
            phone: '3333'
          }
        ],
        totalCustomers: 4
      }
    };
    
    this.stats = mockResponse.stats;
    this.inventory = mockResponse.inventory;
    this.customers = mockResponse.customers;
    
    // Calculate trends 
    this.calculateTrends();
    
    this.isLoading = false;
    
    // Initialize charts after data is loaded and component is rendered
    setTimeout(() => {
      this.initializeCharts();
    }, 0);
  }
  
  // Helper method to format orders for the dashboard
  private formatOrders(orders: any[]): any[] {
    return orders.map(order => ({
      ...order,
      date: new Date(order.date)
    }));
  }
  
  onTimeRangeChange() {
    this.loadDashboardData();
  }
  
  refreshDashboard() {
    this.loadDashboardData();
  }
  
  updateSalesChart() {
    if (this.salesChart) {
      this.salesChart.destroy();
      this.initializeSalesChart();
    }
  }
  
  updateProfitChart() {
    if (this.profitChart) {
      this.profitChart.destroy();
      this.initializeProfitChart();
    }
  }
  
  viewCustomerDetails(customer: any) {
    // Navigate to customer details or open dialog
    console.log('View customer details:', customer);
  }
  
  formatCurrency(value: number): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  
  private calculateTrends() {
    // Mock trend data - in a real app these would be calculated from actual historical data
    this.ordersTrend = Math.floor(Math.random() * 30) - 10;
    this.customersTrend = Math.floor(Math.random() * 20) - 5;
    this.productsTrend = Math.floor(Math.random() * 15) - 3;
    this.revenueTrend = Math.floor(Math.random() * 40) - 15;
    this.profitTrend = Math.floor(Math.random() * 35) - 10;
  }
  
  private initializeCharts() {
    this.initializeSalesChart();
    this.initializeOrderStatusChart();
    this.initializeTopProductsChart();
    this.initializeTopCustomersChart();
    this.initializeProfitChart();
  }
  
  private initializeSalesChart() {
    if (!this.salesChartRef || !this.stats?.salesOverTime) return;
    
    const ctx = this.salesChartRef.nativeElement.getContext('2d');
    
    // Use real data from API
    const labels = this.stats.salesOverTime.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    });
    
    const data = this.stats.salesOverTime.map(item => item.revenue);
    
    this.salesChart = new Chart(ctx, {
      type: this.salesChartType as any,
      data: {
        labels,
        datasets: [{
          label: 'Doanh số',
          data,
          backgroundColor: 'rgba(78, 115, 223, 0.2)',
          borderColor: 'rgba(78, 115, 223, 1)',
          borderWidth: 2,
          fill: this.salesChartType === 'line',
          tension: 0.3,
          pointBackgroundColor: 'rgba(78, 115, 223, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              callback: (value: number) => {
                return this.formatCurrency(value) + ' ₫';
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return 'Doanh số: ' + this.formatCurrency(context.parsed.y) + ' ₫';
              }
            }
          },
          legend: {
            display: false
          }
        }
      }
    });
  }
  
  private initializeOrderStatusChart() {
    if (!this.orderStatusChartRef || !this.stats) return;
    
    const ctx = this.orderStatusChartRef.nativeElement.getContext('2d');
    
    // Use real data from API
    const paid = this.stats.paidOrdersCount || 0;
    const unpaid = this.stats.debtOrdersCount || 0;
    
    // Update the ordersByStatus if it doesn't exist or has incorrect values
    if (!this.stats.ordersByStatus) {
      this.stats.ordersByStatus = {};
    }
    this.stats.ordersByStatus['paid'] = paid;
    this.stats.ordersByStatus['unpaid'] = unpaid;
    
    this.orderStatusChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Đã thanh toán', 'Còn nợ'],
        datasets: [{
          data: [paid, unpaid],
          backgroundColor: ['#43a047', '#e53935'],
          borderColor: ['#388e3c', '#d32f2f'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
  
  private initializeTopProductsChart() {
    if (!this.topProductsChartRef || !this.stats.topProducts) return;
    
    const ctx = this.topProductsChartRef.nativeElement.getContext('2d');
    
    const products = this.stats.topProducts.slice(0, 5);
    
    this.topProductsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: products.map(p => p.name),
        datasets: [{
          label: 'Số lượng bán',
          data: products.map(p => p.totalQuantity || 0),
          backgroundColor: 'rgba(54, 185, 204, 0.8)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
  
  private initializeTopCustomersChart() {
    if (!this.topCustomersChartRef || !this.customers.topCustomers) return;
    
    const ctx = this.topCustomersChartRef.nativeElement.getContext('2d');
    
    const customers = this.customers.topCustomers.slice(0, 5);
    
    this.topCustomersChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: customers.map(c => c.name),
        datasets: [{
          label: 'Doanh thu',
          data: customers.map(c => c.totalSpent),
          backgroundColor: 'rgba(28, 200, 138, 0.8)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            ticks: {
              callback: (value) => {
                return this.formatCurrency(value as number) + ' ₫';
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  private initializeProfitChart() {
    if (!this.profitChartRef || !this.stats?.salesOverTime) return;
    
    const ctx = this.profitChartRef.nativeElement.getContext('2d');
    
    // Use real data from API
    const labels = this.stats.salesOverTime.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    });
    
    // For each day's revenue, calculate estimated profit 
    // If we have totalProfit, distribute it proportionally to revenue
    const revenueData = this.stats.salesOverTime.map(item => item.revenue);
    const totalRevenue = revenueData.reduce((sum, val) => sum + val, 0);
    
    // Calculate profit for each day based on proportion of revenue
    const profitData = revenueData.map(revenue => {
      if (totalRevenue === 0) return 0;
      // Distribute totalProfit proportionally to revenue
      return (revenue / totalRevenue) * (this.stats.totalProfit || 0);
    });
    
    this.profitChart = new Chart(ctx, {
      type: this.profitChartType as any,
      data: {
        labels,
        datasets: [{
          label: 'Lợi nhuận',
          data: profitData,
          backgroundColor: 'rgba(236, 64, 122, 0.2)',
          borderColor: 'rgba(236, 64, 122, 1)',
          borderWidth: 2,
          fill: this.profitChartType === 'line',
          tension: 0.3,
          pointBackgroundColor: 'rgba(236, 64, 122, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              callback: (value: number) => {
                return this.formatCurrency(value) + ' ₫';
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return 'Lợi nhuận: ' + this.formatCurrency(context.parsed.y) + ' ₫';
              }
            }
          },
          legend: {
            display: false
          }
        }
      }
    });
  }
}
