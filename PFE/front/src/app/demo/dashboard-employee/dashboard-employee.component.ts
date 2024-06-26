// angular import
import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';

// project import
import tableData from 'src/fake-data/default-data.json';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { Title } from '@angular/platform-browser';

// bootstrap import
import { AuthService } from '../authentication/auth.service';  // Adjust the path as needed
import { NgxChartsModule } from '@swimlane/ngx-charts'; // Import NgxChartsModule
import { PaginationModule } from '../pagination/PaginationModule'; // Adjust the path as needed
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChartComponent } from 'ng-apexcharts';  // Import ChartComponent
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexGrid,
  ApexTitleSubtitle,
  ApexLegend,
  ChartType,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexFill
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
};
export type ChartOptionsDaily = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
};
export type ChartOptionsDonuts = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  fill: ApexFill;
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
};
/*******Interfaces***** */

interface TopSale {
  designation: string;
  salesbyproduct: number;
}

interface Order {
  vente: string;
  date: Date; 
  heure: string; 
  codemag: string;
  total: number; 
}

interface Famille{
  famille:string
}

interface TotalSalesResponse {
  total_sales: string; // Assuming total_sales is a string in your backend response
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgApexchartsModule, SharedModule,NgxChartsModule,PaginationModule],
  templateUrl: './dashboard-employee.component.html',
  styleUrls: ['./dashboard-employee.component.scss']
})
export default class DashboardEmployeeComponent implements OnInit {
  
/****Filter CodeMag & Date***** */
filteredCodemags: string[] = [];
codemags: string[] = [];
startDate: string;
endDate: string;
baseName: string | null = null;
company: string | null = null;
localisation: string | null = null;
/****Cards **** */
totalSales: number | null = null;
totalSalesCount: number | null = null;
TotalQuantitySold:number | null = null;

card = [
  {
    title: 'Total Sales :'
  },
  {
    title: 'Number of Sales (Transactions) :'
  },
  {
    title: 'Total Quantity Sold :'
  },
  {
    title: 'Total Monthly Sales :'
  }
];
/***bar chart vertical  */
dataVBC: any[] = [];
viewVBC: [number, number] = [800, 300];
animationsVBC = false;
legendVBC = false;
xAxisVBC = false;
yAxisVBC = true;
showYAxisLabelVBC = true;
yAxisLabelVBC = "Sales (TND)";
/****Table Order */
orderList: Order[] = [];
/******Pagination ***** */
paginatedOrders: Order[] = [];
currentPage: number = 1;
rowsPerPage: number = 4;
totalPages: number = 0;

currentPageStock: number = 1;
rowsPerPageStock: number = 4;
totalPagesStock: number = 0;
/****search , order  */
  searchQuery: string = '';
  sortBy: string = 'vente';
  sortOrder: string = 'ASC';

  searchQueryStock: string = '';
  sortByStock: string = 'designation';
  sortOrderStock: string = 'ASC';

  filteredStockData: any[] = [];
  familles:string[]=[];
  selectedFamille: string = '';


/***Pie Chart*** */
@ViewChild('chart') chart: ChartComponent;
  public chartOptionsPie: any//Partial<ChartOptionsPie>;
  public chartOptions: Partial<ChartOptions>;
  public chartOptionsDaily: Partial<ChartOptionsDaily>;

/***Donut Chart */
public chartOptionsDonuts: any//Partial<ChartOptionsDonuts>;

/*Stock Fournisseur***/
stockData: any[];
familleFilter: string = '';
/*----monthly-totlal-sales----*/
totalSalesMonthly: number | null = null;

  // constructor
  constructor(private http: HttpClient,private authService: AuthService,private titleService: Title) {
    this.chartOptionsPie = {
      series: [],
      chart: {
        width: 380,
        type: "pie"
      },
      labels: [],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ]
    };

    this.chartOptions = {
      series: [],
      chart: {
        type: 'line'
      },
      xaxis: {
        categories: []
      },
      yaxis: {},
      stroke: {},
      title: {
        text: ''
      }
    };

    this.chartOptionsDonuts = {
      series: [],
      chart: {
        width: 380,
        type: "donut"
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        type: "gradient"
      },
      legend: {
        formatter: function(val, opts) {
          return val + " - " + opts.w.globals.series[opts.seriesIndex];
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ]
    };

    this.chartOptionsDaily = {
      series: [],
      chart: {
        type: 'line'
      },
      xaxis: {
        categories: []
      },
      yaxis: {},
      stroke: {},
      title: {
        text: ''
      }
    };
  }
  
  // life cycle event
  ngOnInit(): void {
    this.titleService.setTitle('ZaiDash Plus Employee');
    this.company = this.authService.getCompany();
    this.localisation = this.authService.getUserData().localisation;
    this.baseName = this.authService.getBaseName();
    this.fetchTotalSales();
    this.fetchTotalSalesCount();
    this.fetchTotalQuantitySold();
    this.fetchTop10SalesByProduct();
    this.fetchOrders();
    this.fetchSalesPerEmployee();
    this.fetchMonthlySalesRevenue();
    this.fetchRepeatCustomers();
    this.fetchStockFournisseurData();
    this.fetchFamilles();
    this.fetchAVGDailySales();
    this.fetchTotalSalesMonthly();

  }

  applyDateFilter(): void {
  }

  fetchTotalSales(): void {
    const userData = this.authService.getUserData();
    const params = new HttpParams()
      .set('type', userData.Type)
      .set('database', userData.baseName)
      .set('localisation', userData.localisation); // Add the localisation parameter

    this.http.get<any[]>('http://localhost:3000/totalsales', { params })
      .subscribe(
        (response) => {
         // console.log("total sales",response)
          if (response.length > 0) {
            this.totalSales = parseFloat(response[0].totalsales); // Convert to number
          } else {
            this.totalSales = null;  // No data found
          }
        },
        (error) => {
          console.error('Error fetching total sales:', error);
        }
      );
  }

  fetchTotalSalesCount(): void{
    const userData = this.authService.getUserData();
    const params = new HttpParams()
      .set('localisation', userData.localisation); // Add the localisation parameter
  
    this.http.get<any[]>('http://localhost:3000/TotalSalesCount',{params})
      .subscribe(
        (response) => {
         // console.log('Total sales API response:', response);
          if (response.length > 0) {
            this.totalSalesCount = parseFloat(response[0].totalvente); // Convert to number
          } else {
            this.totalSalesCount = null;  // No data found
          }
          //console.log('Total sales:', this.totalSales);
        },
        (error) => {
          console.error('Error fetching total sales:', error);
        }
      );

  }

  fetchTotalQuantitySold(): void {
    const userData = this.authService.getUserData();
    const params = new HttpParams()
      .set('localisation', userData.localisation); // Add the localisation parameter

    this.http.get<any[]>('http://localhost:3000/TotalQuantitySold',{params})
      .subscribe(
        (response) => {
         // console.log('Total sales API response:', response);
          if (response.length > 0) {
            this.TotalQuantitySold = parseFloat(response[0].totalquantitysold); // Convert to number
          } else {
            this.TotalQuantitySold = null;  // No data found
          }
          //console.log('Total sales:', this.totalSales);
        },
        (error) => {
          console.error('Error fetching total sales:', error);
        }
      );
  }

  fetchTop10SalesByProduct(): void {
    const userData = this.authService.getUserData();
    const params = new HttpParams()
      .set('type', userData.Type)
      .set('localisation', userData.localisation); // Add the localisation parameter
  
    this.http.get<TopSale[]>('http://localhost:3000/topsales',{params})
      .subscribe(
        (data) => {
          this.dataVBC = data.slice(0, 10).map(item => ({
            name: item.designation,
            value: item.salesbyproduct
          }));
        },
        (error) => {
          console.error('Error fetching sales data', error);
        }
      );
  }

  dataLabelFormatterVBC(tooltipText: any) {
    return   tooltipText +" DT";
  }

  fetchOrders(): void {
    const userData = this.authService.getUserData();
    let params = new HttpParams()
      .set('search', this.searchQuery)
      .set('sortBy', this.sortBy)
      .set('sortOrder', this.sortOrder)
      .set('page', this.currentPage.toString())
      .set('rowsPerPage', this.rowsPerPage.toString())
      //.set('startDate', this.startDate || '')
      //.set('endDate', this.endDate || '')
      .set('type', userData.Type)
      .set('localisation', userData.localisation); // Add the localisation parameter
   
  
    this.http.get<Order[]>('http://localhost:3000/RecentOrders', { params }).subscribe(
      (response:any) => {
        this.orderList = response.orders;
        //console.log("the-order-list",this.orderList)
        this.totalPages = Math.ceil(response.total / this.rowsPerPage);
        this.paginatedOrders = this.orderList; // Directly assign the fetched orders
      },
      (error: HttpErrorResponse) => {
        console.error('Error retrieving recent orders', error);
      }
    );
  }

  onSortChange(sortBy: string): void {
    this.sortBy = sortBy;
    this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    this.fetchOrders();
  }

  onSearchChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value;
    this.fetchOrders();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.fetchOrders();
  }

  fetchSalesPerEmployee(): void {
    const userData = this.authService.getUserData();
    const params = new HttpParams()
      .set('type', userData.Type)
      .set('localisation', userData.localisation); // Add the localisation parameter

  
    this.http.get<any[]>('http://localhost:3000/salesperemployee',{params})
      .subscribe(data => {
        const seriesData: number[] = data.map(item => parseFloat(item.salesperemployee));
        const labelsData: string[] = data.map(item => item.vendeur);
        this.chartOptionsPie.series = seriesData;
        this.chartOptionsPie.labels = labelsData;
      });
  }
 
  fetchMonthlySalesRevenue(): void {
    const userData = this.authService.getUserData();
    const params = new HttpParams()
      .set('type', userData.Type)
      .set('localisation', userData.localisation); // Add the localisation parameter

    let url = 'http://localhost:3000/monthly_sales_revenue';
  
    this.http.get(url,{params}).subscribe((data: any) => {
      const formattedData = this.formatChartData(data);
      this.chartOptions = {
        series: [{
          name: 'Monthly Sales Revenue',
          data: formattedData.series
        }],
        chart: {
          type: 'line',
          height: 350
        },
        xaxis: {
          type: 'datetime',
          categories: formattedData.categories
        },
        yaxis: {
          labels: {
            formatter: (val: number) => Math.floor(val).toString() + ' DT'
          }
        },
        stroke: {
          curve: 'smooth'
        },
        title: {
          text: 'Monthly Sales Revenue',
          align: 'left'
        }
      };
    });
  }

  formatChartData(data: any) {
    const categories = data.map((item: any) => {
      const date = new Date(item.month);
      return date.getTime();
    });
  
    const series = data.map((item: any) => {
      const value = parseFloat(item.monthlysalesrevenue);
      return isNaN(value) ? 0 : value;
    });
  
    return { categories, series };
  }

  fetchRepeatCustomers(): void {
    const userData = this.authService.getUserData();
    const params = new HttpParams()
      .set('localisation', userData.localisation); 
    this.http.get<any>('http://localhost:3000/api/repeat-customer-data', { params })
      .subscribe(
        (data) => {
          //console.log("infrequentCustomers", data.infrequentCustomers);
  
          const repeatCustomers = parseInt(data.repeatCustomers, 10); // Convert string to integer
          const infrequentCustomers = parseInt(data.infrequentCustomers, 10); 
  
          console.log("Data received:", data);
          console.log("repeatCustomers ", repeatCustomers )
          console.log("infrequentCustomers",infrequentCustomers)
  
          this.chartOptionsDonuts = {
            series: [repeatCustomers, infrequentCustomers],
            chart: {
              width: 420,
              type: "donut"
            },
            labels: ['Repeat Customers', 'Infrequent Customers'],
            dataLabels: {
              enabled: false
            },
            fill: {
              type: "gradient"
            },          
            colors: ['#00ff00', '#ff0000'], // Green for repeat customers, red for infrequent customers
            legend: {
              formatter: function(val, opts) {
                return val + " - " + opts.w.globals.series[opts.seriesIndex];
              }
            },
            responsive: [
              {
                breakpoint: 480,
                options: {
                  chart: {
                    width: 200
                  },
                  legend: {
                    position: "bottom"
                  }
                }
              }
            ]
          };
        },
        (error) => {
          console.error('Error fetching repeat customers data:', error);
        }
      );
  }
  
  fetchFamilles(): void {
    this.http.get<Famille[]>('http://localhost:3000/famille')
      .subscribe(
        (response) => {
          this.familles = response.map(item => item.famille);
        },
        (error) => {
          console.error('Error fetching famille:', error);
        }
      );
  }


fetchStockFournisseurData(): void {
  const userData = this.authService.getUserData();
  const params = new HttpParams()
    .set('localisation', userData.localisation)
    .set('search', this.searchQueryStock)
    .set('sortBy', this.sortByStock)
    .set('sortOrder', this.sortOrderStock)
    .set('page', this.currentPageStock.toString())
    .set('rowsPerPage', this.rowsPerPageStock.toString());

  this.http.get<{ stockData: any[], totalRows: number }>('http://localhost:3000/stockFournisseur', { params })
    .subscribe(response => {
      
      this.stockData = response.stockData;
      console.log("stockData",this.stockData)
      this.totalPagesStock = Math.ceil(response.totalRows / this.rowsPerPageStock);
      this.filterStockData();
    }, error => {
      console.error('Error fetching stock data:', error);
    });
}

onPageChangeStock(page: number): void {
  this.currentPageStock = page;
  this.fetchStockFournisseurData();
}
  onFilterChange(): void {
    this.filterStockData();
  }

  filterStockData(): void {
    if (this.familleFilter === '') {
      this.filteredStockData = this.stockData;
    } else {
      this.filteredStockData = this.stockData.filter(item => item.famille === this.familleFilter);
      console.log("filteredStockData",this.filteredStockData)
    }
  }
  onSortChangeStock(sortByStock: string): void {
    this.sortByStock = sortByStock;
    this.sortOrderStock = this.sortOrderStock === 'ASC' ? 'DESC' : 'ASC';
    this.fetchStockFournisseurData();
  }

  onSearchChangeStock(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchQueryStock = inputElement.value;
    this.fetchStockFournisseurData();
  }
  fetchAVGDailySales():void{
  const userData = this.authService.getUserData();
    const params = new HttpParams()
      .set('localisation', userData.localisation); // Add the localisation parameter
      //console.log("this.localisation",params)
      let url = 'http://localhost:3000/AvgDailySales';

      this.http.get(url, { params }).subscribe((data: any) => {
        const formattedData = this. formatChartDataDaily(data);
        this.chartOptionsDaily = {
          series: [{
            name: 'Average Daily Sales',
            data: formattedData.series
          }],
          chart: {
            type: 'line',
            height: 350
          },
          xaxis: {
            type: 'datetime',
            categories: formattedData.categories
          },
          yaxis: {
            labels: {
              formatter: (val: number) => val.toFixed(2) + ' DT' // Adjust formatting as needed
            }
          },
          stroke: {
            curve: 'smooth'
          },
          title: {
            text: 'Average Daily Sales',
            align: 'left'
          }
        };
      });
  }
    
  formatChartDataDaily(data: any): { series: any[], categories: any[] } {
      const series = [];
      const categories = [];
    
      data.forEach((item: any) => {
        categories.push(item.date); // Assuming Date is the property name for the date
        series.push(item.average_sales_per_day); // Assuming average_sales_per_day is the property name for the average sales
      });
    
      return { series, categories };
  }  

  fetchTotalSalesMonthly(codemag?: string): void {
    const userData = this.authService.getUserData();
    const params = new HttpParams()
    .set('localisation', userData.localisation); // Add the localisation parameter
  
    this.http.get<TotalSalesResponse>('http://localhost:3000/total-sales-monthly-emp', { params })
      .subscribe(
        (response) => {
          if (response && response.total_sales !== undefined) {
            this.totalSalesMonthly = parseFloat(response.total_sales); // Convert to number
            console.log("Total Sales Monthly", this.totalSalesMonthly);
          } else {
            this.totalSalesMonthly = null;  // No data found
            console.log("Total Sales Monthly is null");
          }
        },
        (error) => {
          console.error('Error fetching total sales:', error);
        }
      );
  }
}
