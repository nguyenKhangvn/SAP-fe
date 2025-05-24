import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DashboardService, DashboardStats, InventoryStats, CustomerStats, RecentOrder, SalesOverTime } from '../services/dashboard.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css', './dashboard-v1.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  // Chart references
  @ViewChild('salesChart') salesChartRef!: ElementRef;
  @ViewChild('orderStatusChart') orderStatusChartRef!: ElementRef;
  @ViewChild('topProductsChart') topProductsChartRef!: ElementRef;
  @ViewChild('topCustomersChart') topCustomersChartRef!: ElementRef;
  @ViewChild('profitChart') profitChartRef!: ElementRef;

  // Data properties
  // Khởi tạo các thuộc tính với giá trị mặc định để tránh lỗi undefined khi render lần đầu
  stats: DashboardStats = {
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    totalDebt: 0,
    totalProfit: 0,
    recentOrders: [],
    allOrders: [],
    ordersByStatus: { 'paid': 0, 'unpaid': 0 },
    topProducts: [],
    salesOverTime: []
  };
  inventory: InventoryStats = {
    inventorySummary: [],
    lowStockProducts: [],
    totalProductsInStock: 0,
    totalOutOfStock: 0,
    totalInventoryCostValue: 0,
    totalInventorySaleValue: 0
  };
  customers: CustomerStats = {
    topCustomers: [],
    newCustomers: 0,
    customersWithDebt: [],
    totalCustomers: 0
  };
  isLoading = true;
  error: string | null = null;

  // Dashboard controls
  selectedTimeRange = 'week'; // Default to 7 days for more meaningful salesOverTime data
  salesChartType = 'line'; // Default to line chart
  profitChartType = 'line'; // Default to line chart

  // Trend indicators
  ordersTrend = 0;
  customersTrend = 0;
  productsTrend = 0; // Not directly available from API, will keep at 0
  revenueTrend = 0;
  profitTrend = 0;

  // Chart instances
  salesChart: Chart | null = null;
  orderStatusChart: Chart | null = null;
  topProductsChart: Chart | null = null;
  topCustomersChart: Chart | null = null;
  profitChart: Chart | null = null;

  statusForPaymentPaidAndUnpaid: { paid: number; unpaid: number } = { paid: 0, unpaid: 0 };

  constructor(private dashboardService: DashboardService) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    // Charts will be initialized after data is loaded in loadDashboardData()
    // and a setTimeout is used to ensure ViewChild references are ready.
  }

  /**
   * Loads all dashboard data from the API based on the selected time range.
   * Handles loading state and error messages.
   */
  loadDashboardData() {
    this.isLoading = true;
    this.error = null;

    // Call the service to get all dashboard data
    this.dashboardService.getDashboardData(this.selectedTimeRange).subscribe({
      next: (response) => {
        // Assign data from the API response to component properties
        this.stats = response.stats;
        this.inventory = response.inventory;
        this.customers = response.customers;

        // Ensure ordersByStatus is correctly populated for the pie chart
        let paidCnt = this.stats.recentOrders.filter(o => o.isPaid === true).length;
        let unpaidCnt = this.stats.recentOrders.filter(o => o.isPaid === false).length;
        this.statusForPaymentPaidAndUnpaid = {
          paid: paidCnt || 0,
          unpaid: unpaidCnt || 0
        };

        // Format the dates for recent orders if needed for display
        if (this.stats.recentOrders) {
          this.stats.recentOrders = this.formatOrders(this.stats.recentOrders);
        }

        // Calculate trends based on the newly loaded data
        this.calculateTrends();

        this.isLoading = false;

        // Re-initialize charts after data is loaded and DOM is updated
        // Using setTimeout to ensure @ViewChild references are available
        setTimeout(() => {
          this.initializeCharts();
        }, 0);
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.error = 'Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại sau.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Helper method to format order dates for display.
   * @param orders Array of recent orders.
   * @returns Formatted array of recent orders.
   */
  private formatOrders(orders: RecentOrder[]): RecentOrder[] {
    return orders.map(order => ({
      ...order,
      date: new Date(order.date).toISOString() // Keep as ISO string or convert to Date object if needed for pipes
    }));
  }

  /**
   * Handles changes in the time range selection.
   * Reloads dashboard data with the new time range.
   */
  onTimeRangeChange() {
    console.log(`Time range changed to: ${this.selectedTimeRange}`);
    this.loadDashboardData();
  }

  /**
   * Refreshes the dashboard data with current settings.
   */
  refreshDashboard() {
    console.log('Refreshing dashboard data');
    this.loadDashboardData();
  }

  /**
   * Updates the sales chart type (line/bar).
   * Destroys the old chart and initializes a new one.
   */
  updateSalesChart() {
    if (this.salesChart) {
      this.salesChart.destroy();
    }
    this.initializeSalesChart();
  }

  /**
   * Updates the profit chart type (line/bar).
   * Destroys the old chart and initializes a new one.
   */
  updateProfitChart() {
    if (this.profitChart) {
      this.profitChart.destroy();
    }
    this.initializeProfitChart();
  }

  /**
   * Placeholder for viewing customer details.
   * @param customer The customer object to view.
   */
  viewCustomerDetails(customer: any) {
    console.log('View customer details:', customer);
    // Implement navigation or dialog opening here
  }

  /**
   * Formats a number as currency with Vietnamese dong symbol and dot separator.
   * @param value The number to format.
   * @returns Formatted currency string.
   */
  formatCurrency(value: number | undefined | null): string {
    if (value === undefined || value === null) {
      return '0';
    }
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /**
   * Calculates trend percentages for orders, customers, revenue, and profit.
   * Compares the latest data point with an average of previous data points.
   */
  private calculateTrends() {
    // Orders and Revenue Trend (from salesOverTime)
    if (this.stats && this.stats.salesOverTime && this.stats.salesOverTime.length > 1) {
      const dataPoints = this.stats.salesOverTime;

      // Get the last data point
      const lastDataPoint = dataPoints[dataPoints.length - 1];

      // Calculate average of previous data points (excluding the last one)
      const previousDataPoints = dataPoints.slice(0, -1);
      const avgPreviousOrders = previousDataPoints.length > 0 ?
        previousDataPoints.reduce((sum, val) => sum + (val.orderCount || 0), 0) / previousDataPoints.length : 0;
      const avgPreviousRevenue = previousDataPoints.length > 0 ?
        previousDataPoints.reduce((sum, val) => sum + (val.revenue || 0), 0) / previousDataPoints.length : 0;

      // Calculate Orders Trend
      if (avgPreviousOrders > 0) {
        this.ordersTrend = Math.round(((lastDataPoint.orderCount - avgPreviousOrders) / avgPreviousOrders) * 100);
      } else {
        this.ordersTrend = lastDataPoint.orderCount > 0 ? 100 : 0; // If no previous orders, and current > 0, show 100% growth
      }

      // Calculate Revenue Trend
      if (avgPreviousRevenue > 0) {
        this.revenueTrend = Math.round(((lastDataPoint.revenue - avgPreviousRevenue) / avgPreviousRevenue) * 100);
      } else {
        this.revenueTrend = lastDataPoint.revenue > 0 ? 100 : 0; // If no previous revenue, and current > 0, show 100% growth
      }

      // Profit Trend (estimate based on revenue trend if daily profit isn't in salesOverTime)
      // If totalProfit is available, we can use it for the overall card, but for trend, we estimate from revenue.
      this.profitTrend = this.revenueTrend; // Assuming profit trend follows revenue trend closely
    } else {
      // Default to 0 if not enough historical data for trends
      this.ordersTrend = 0;
      this.revenueTrend = 0;
      this.profitTrend = 0;
    }

    // Customers Trend (using newCustomers from API)
    // The API provides 'newCustomers' which can be interpreted as growth.
    // If a percentage change is required, we'd need 'totalCustomers' from a previous period,
    // which is not directly available in the provided API response.
    this.customersTrend = this.customers.newCustomers || 0;

    // Products Trend (not directly available from API, defaulting to 0)
    this.productsTrend = 0;
  }

  /**
   * Initializes all Chart.js instances.
   */
  private initializeCharts() {
    // Destroy existing chart instances before re-initializing to prevent memory leaks
    if (this.salesChart) this.salesChart.destroy();
    if (this.orderStatusChart) this.orderStatusChart.destroy();
    if (this.topProductsChart) this.topProductsChart.destroy();
    if (this.topCustomersChart) this.topCustomersChart.destroy();
    if (this.profitChart) this.profitChart.destroy();

    this.initializeSalesChart();
    this.initializeOrderStatusChart();
    this.initializeTopProductsChart();
    this.initializeTopCustomersChart();
    this.initializeProfitChart();
  }

  /**
   * Initializes the Sales Chart (line or bar).
   */
  private initializeSalesChart() {
    if (!this.salesChartRef || !this.stats?.salesOverTime || this.stats.salesOverTime.length === 0) {
      console.warn('Cannot initialize sales chart - data not available or empty.');
      return;
    }

    const ctx = this.salesChartRef.nativeElement.getContext('2d');

    // Prepare labels (dates) and data (revenue) for the chart
    const labels = this.stats.salesOverTime.map(item => {
      try {
        const date = new Date(item.date);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      } catch (e) {
        console.warn('Invalid date format in salesOverTime data:', item.date, e);
        return 'N/A';
      }
    });

    const data = this.stats.salesOverTime.map(item => item.revenue || 0);

    this.salesChart = new Chart(ctx, {
      type: this.salesChartType as any, // 'line' or 'bar'
      data: {
        labels,
        datasets: [{
          label: 'Doanh số',
          data,
          backgroundColor: this.salesChartType === 'line' ? 'rgba(78, 115, 223, 0.2)' : 'rgba(78, 115, 223, 0.8)',
          borderColor: 'rgba(78, 115, 223, 1)',
          borderWidth: 2,
          fill: this.salesChartType === 'line', // Fill area only for line chart
          tension: 0.3, // Smooth curves for line chart
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
            beginAtZero: true,
            ticks: {
              callback: (tickValue: string | number, index: number, ticks: any[]) => {
                return this.formatCurrency(Number(tickValue)) + ' ₫';
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
            display: false // Hide legend as there's only one dataset
          }
        }
      }
    });
  }

  /**
   * Initializes the Order Status Chart (pie chart).
   */
  private initializeOrderStatusChart() {
    if (!this.orderStatusChartRef || !this.stats) {
      console.warn('Cannot initialize order status chart - data not available.');
      return;
    }

    const ctx = this.orderStatusChartRef.nativeElement.getContext('2d');

    // Use direct counts from API response
    const paid = this.statusForPaymentPaidAndUnpaid.paid || 0;
    const unpaid = this.statusForPaymentPaidAndUnpaid.unpaid || 0;

    // If both are 0, set a default value to show something on the chart (e.g., 1 for paid)
    // This prevents Chart.js from throwing an error with empty datasets.
    const chartData = (paid === 0 && unpaid === 0) ? [0, 0] : [paid, unpaid]; // Show 1 paid if no data

    this.orderStatusChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Đã thanh toán', 'Còn nợ'],
        datasets: [{
          data: chartData,
          backgroundColor: ['#43a047', '#e53935'], // Green for paid, Red for unpaid
          borderColor: ['#388e3c', '#d32f2f'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom', // Place legend at the bottom
            labels: {
              generateLabels: (chart) => {
                const data = chart.data.datasets[0].data;
                return chart.data.labels!.map((label, i) => ({
                  text: `${label}: ${data[i]}`,
                  fillStyle: (chart.data.datasets[0].backgroundColor as string[])[i],
                  strokeStyle: (chart.data.datasets[0].borderColor as string[])[i],
                  lineWidth: 1,
                  hidden: !chart.getDataVisibility(i),
                  index: i
                }));
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((sum: number, current: number) => sum + current, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Initializes the Top Products Chart (bar chart).
   */
  private initializeTopProductsChart() {
    if (!this.topProductsChartRef || !this.stats?.topProducts || this.stats.topProducts.length === 0) {
      console.warn('Cannot initialize top products chart - data not available or empty.');
      return;
    }

    const ctx = this.topProductsChartRef.nativeElement.getContext('2d');

    // Take top 5 products
    const products = this.stats.topProducts.slice(0, 5);

    this.topProductsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: products.map(p => p.name),
        datasets: [{
          label: 'Số lượng bán',
          data: products.map(p => p.totalQuantity || 0),
          backgroundColor: 'rgba(54, 185, 204, 0.8)', // Blue-green color
          borderColor: 'rgba(54, 185, 204, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // Make it a horizontal bar chart
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0 // Ensure integer ticks for quantity
            }
          },
          y: {
            ticks: {
              autoSkip: false, // Prevent labels from being skipped
              maxRotation: 0,
              minRotation: 0
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return `Số lượng: ${context.parsed.x}`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Initializes the Top Customers Chart (bar chart).
   */
  private initializeTopCustomersChart() {
    if (!this.topCustomersChartRef || !this.customers?.topCustomers || this.customers.topCustomers.length === 0) {
      console.warn('Cannot initialize top customers chart - data not available or empty.');
      return;
    }

    const ctx = this.topCustomersChartRef.nativeElement.getContext('2d');

    // Take top 5 customers
    const customers = this.customers.topCustomers.slice(0, 5);

    this.topCustomersChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: customers.map(c => c.name),
        datasets: [{
          label: 'Doanh thu',
          data: customers.map(c => c.totalSpent || 0),
          backgroundColor: 'rgba(28, 200, 138, 0.8)', // Green color
          borderColor: 'rgba(28, 200, 138, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // Make it a horizontal bar chart
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: (tickValue: string | number, index: number, ticks: any[]) => {
                return this.formatCurrency(Number(tickValue)) + ' ₫';
              }
            }
          },
          y: {
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              minRotation: 0
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return 'Doanh thu: ' + this.formatCurrency(context.parsed.x) + ' ₫';
              }
            }
          }
        }
      }
    });
  }

  /**
   * Initializes the Profit Chart (line or bar).
   * Estimates daily profit based on total profit and daily revenue proportion.
   */
  private initializeProfitChart() {
    if (!this.profitChartRef || !this.stats?.salesOverTime || this.stats.salesOverTime.length === 0) {
      console.warn('Cannot initialize profit chart - data not available or empty.');
      return;
    }

    const ctx = this.profitChartRef.nativeElement.getContext('2d');

    const labels = this.stats.salesOverTime.map(item => {
      try {
        const date = new Date(item.date);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      } catch (e) {
        console.warn('Invalid date format in salesOverTime data:', item.date, e);
        return 'N/A';
      }
    });

    const revenueData = this.stats.salesOverTime.map(item => item.revenue || 0);
    const totalRevenueAcrossTime = revenueData.reduce((sum, val) => sum + val, 0);

    // Calculate profit for each day based on its proportion of total revenue
    // and the overall total profit received from the API.
    const profitData = revenueData.map(revenue => {
      if (totalRevenueAcrossTime === 0 || !this.stats.totalProfit) return 0;
      return (revenue / totalRevenueAcrossTime) * this.stats.totalProfit;
    });

    this.profitChart = new Chart(ctx, {
      type: this.profitChartType as any, // 'line' or 'bar'
      data: {
        labels,
        datasets: [{
          label: 'Lợi nhuận',
          data: profitData,
          backgroundColor: this.profitChartType === 'line' ? 'rgba(236, 64, 122, 0.2)' : 'rgba(236, 64, 122, 0.8)', // Pink color
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
            beginAtZero: true,
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
