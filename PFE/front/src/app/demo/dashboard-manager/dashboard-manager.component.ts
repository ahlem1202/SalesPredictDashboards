import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams, HttpHeaders  } from '@angular/common/http';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgxChartsModule } from '@swimlane/ngx-charts'; // Import NgxChartsModule
import { Color,ScaleType  } from '@swimlane/ngx-charts';
import { PaginationModule } from '../pagination/PaginationModule'; // Adjust the path as needed
import { ChartComponent } from 'ng-apexcharts';  // Import ChartComponent
import { AuthService } from '../authentication/auth.service';  // Adjust the path as needed
import { Title } from '@angular/platform-browser';

// Import ChartOptions from the correct location
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
  ChartType
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
};

interface TransfertData {
  codemag: string;
  nature: string;
  date: string;
  heure: string;
  total: number;
  quantite: number;
}

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

interface StockLevel {
  designation: string;
  stocklevel: number;
}

interface Codemag {
  codemag_id: string;
}

interface TotalSalesResponse {
  total_sales: string; // Assuming total_sales is a string in your backend response
}

@Component({
  selector: 'app-dashboard-manager',
  standalone: true,
  imports: [NgApexchartsModule, SharedModule,NgxChartsModule,PaginationModule],
  templateUrl: './dashboard-manager.component.html',
  styleUrls: ['./dashboard-manager.component.scss']
})

export class DashboardManagerComponent implements OnInit {
  tableData: any[] = [];
  startDate: string;
  endDate: string;
  totalSales: number | null = null;
  totalSalesMonthly: number | null = null; // To store the sales data
  totalVente:number | null = null;
  errorMessage: string | null = null;
  totalclient :number | null = null;
  dataVBC: any[] = [];
  viewVBC: [number, number] = [800, 300];
  animationsVBC = false;
  legendVBC = false;
  xAxisVBC = false;
  yAxisVBC = true;
  showYAxisLabelVBC = true;
  yAxisLabelVBC = "Sales (TND)";
/*----PAgination----*/
  orderList: Order[] = [];
  paginatedOrderList: Order[] = [];
  searchQuery = '';
  sortBy = 'date';
  sortOrder = 'desc';
    currentPage = 1;
    totalPages = 1;
    rowsPerPage = 4;
    
    transfertList: TransfertData[] = [];
  paginatedTransfertList: TransfertData[] = [];
  searchQueryTransfert = '';
  sortByTransferts: string = 'date';
  sortOrderTransferts: string = 'desc';
  currentPageTransferts: number = 1;
  totalPagesTransferts: number = 1;
  rowsPerPageTransferts: number = 6;
 
  
 
  /****filter , order
  searchQuery: string = '';
  sortBy: string = 'vente';
  sortOrder: string = 'ASC';****/


  @ViewChild('chart') chart: ChartComponent;
  public chartOptionsPie: any//Partial<ChartOptionsPie>;
  public chartOptions: Partial<ChartOptions>;

  public loading = true; // Add loading flag

 /****Horizental bar chart **/
  single: any[];
  view: [number, number] = [800, 200]; // Define view as an array of two numbers

  // options
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  gradient: boolean = false;
  showLegend: boolean = true;
  showXAxisLabel: boolean = true;
  yAxisLabel: string = 'Client Types';
  showYAxisLabel: boolean = true;
  xAxisLabel = 'Client Count';
  legendTitle: string = 'Customer Groups';
  
  colorScheme: Color = {
    name: 'cool', // Example name
    selectable: true, // Example selectable property
    group: ScaleType.Ordinal, // Use ScaleType.Ordinal instead of 'Ordinal'
    domain: ['#AAAAAA', '#C7B42C', '#5AA454']
  };

  schemeType: ScaleType = ScaleType.Linear; // Use ScaleType.Linear or another valid value
  /*Gauge chart**/
  singlestock: any[];
  viewstock: [number, number] = [900, 900];
  legend: boolean = true;
  colorSchemestock: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5','#C7B42C','#F5DF4D','#CF5C78','#00A0B0']
  };

  transfertData: TransfertData[] = [];

/****Filter CodeMag ***** */
selectedCodemag: string = '';
codemags: string[] = [];
noDataFound: boolean = false;

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
}

card = [
    {
      title: 'Total Sales :'
      // Other properties...
    },
    {
      title: 'Total Clients :'
      // Other properties...
    },
    {
      title: 'Total Monthly Sales :'
      // Other properties...
    },
    {
      title: 'Forecasted Total Monthly Sales:'
      // Other properties...
    }
];

ngOnInit(): void {
  this.titleService.setTitle('ZaiDash Plus Manager');
  this.fetchCodemags();
    this.fetchTotalSales();
    this.fetchTop10SalesByProduct();
    //this.fetchSalesByProduct();
    this.fetchDataLOYALCUSTOMER();
    this.fetchOrders();
    this.fetchTotalClient();
    //the filter
    this.fetchSalesData();
    this.fetchMonthlySalesRevenue();
    this.fetchSalesPerEmployee();
    this.fetchTransferts();
    this.fetchTotalSalesMonthly();
} 

fetchCodemags(): void {
  const userData = this.authService.getUserData();
  const headers = new HttpHeaders().set('userid', userData.id.toString()); // Convert userId to string

  this.http.get<Codemag[]>('http://localhost:3000/codemags',{ headers })
    .subscribe(
      (response) => {
        //console.log("Response from codemags API:", response);
        this.codemags = response.map(item => item.codemag_id);
        //console.log("Codemags:", this.codemags);
      },
      (error) => {
        console.error('Error fetching codemags:', error);
      }
    );
}

onFilterChange(newCodemag: string): void {
  this.selectedCodemag = newCodemag;
  this.fetchTotalSales(newCodemag === 'All' ? null : newCodemag);
  this.fetchTop10SalesByProduct();
  this.fetchOrders(newCodemag);
  this.fetchSalesPerEmployee(newCodemag);
  this.fetchSalesData(newCodemag);
  this.fetchMonthlySalesRevenue(newCodemag);
  this.fetchTransferts(newCodemag);
  this.fetchDataLOYALCUSTOMER(newCodemag);
  this.fetchTotalSalesMonthly(newCodemag === 'All' ? null : newCodemag);

}

fetchSalesPerEmployee(codemag?: string): void {
  let params = codemag ? { codemag: codemag } : {};
  const userData = this.authService.getUserData();
  const headers = new HttpHeaders().set('userid', userData.id.toString()); // Convert userId to string


  this.http.get<any[]>('http://localhost:3000/salesperemployee', { params, headers })
    .subscribe(data => {
      const seriesData: number[] = data.map(item => parseFloat(item.salesperemployee));
      const labelsData: string[] = data.map(item => item.vendeur);

      this.chartOptionsPie.series = seriesData;
      this.chartOptionsPie.labels = labelsData;
    });
}

fetchMonthlySalesRevenue(codemag?: string): void {
  const userData = this.authService.getUserData();
  const headers = new HttpHeaders().set('userid', userData.id.toString()); // Convert userId to string

  let url = 'http://localhost:3000/monthly_sales_revenue';
  if (codemag) {
    url += `?codemag=${codemag}`;
  }

  this.http.get(url,{headers}).subscribe((data: any) => {
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

//*****filter-date******
applyDateFilter(): void {
  this.fetchTotalSales();
  this.fetchTop10SalesByProduct();
  this.fetchDataLOYALCUSTOMER();
  this.fetchOrders();
  this.fetchTotalClient();
}



fetchOrders(codemag?: string): void {
  const userData = this.authService.getUserData();
  const headers = new HttpHeaders().set('userid', userData.id.toString());

  let params = new HttpParams()
    .set('search', this.searchQuery)
    .set('sortBy', this.sortBy)
    .set('sortOrder', this.sortOrder)
    .set('page', this.currentPage.toString())
    .set('rowsPerPage', this.rowsPerPage.toString())
    .set('startDate', this.startDate || '')  // Ensure startDate and endDate are properly set
    .set('endDate', this.endDate || '');
  if (codemag) {
    params = params.set('codemag', codemag);
  }

  console.log('Fetching orders with parameters:', params.toString());

  this.http.get<Order[]>('http://localhost:3000/RecentOrders', { params, headers }).subscribe(
    (response: any) => {
      this.orderList = response.orders;
      this.totalPages = Math.ceil(response.total / this.rowsPerPage);
      this.paginatedOrderList = this.orderList; // Directly assign the fetched orders
     
    },
    (error) => {
      console.error('Error retrieving recent orders', error);
    }
  );
}

onPageChange(page: number): void {
  this.currentPage = page;
  this.fetchOrders(this.selectedCodemag);
}

onSearchChange(event: any): void {
  this.searchQuery = event.target.value;
  this.currentPage = 1; // Reset to first page on search
  this.fetchOrders(this.selectedCodemag);
}

onSortChange(sortBy: string): void {
  this.sortBy = sortBy;
  this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
  this.fetchOrders(this.selectedCodemag);
}

fetchTransferts(codemag?: string): void {
  const userData = this.authService.getUserData();
  const headers = new HttpHeaders().set('userid', userData.id.toString());

  let params = new HttpParams()
    .set('search', this.searchQueryTransfert)
    .set('sortBy', this.sortByTransferts)
    .set('sortOrder', this.sortOrderTransferts)
    .set('page', this.currentPageTransferts.toString())
    .set('rowsPerPage', this.rowsPerPageTransferts.toString());

  if (codemag) {
    params = params.set('codemag', codemag);
  }
  console.log('Fetching transferts with parameters:', params.toString());

  this.http.get<{ transferts: TransfertData[], total: number }>('http://localhost:3000/transfert', { params, headers }).subscribe(
    (response) => {
      this.transfertList = response.transferts;
      this.totalPagesTransferts = Math.ceil(response.total / this.rowsPerPageTransferts);
      this.paginatedTransfertList = this.transfertList; // Directly assign the fetched orders
    //  this.updatePaginatedTransferts();
    },
    (error) => {
      console.error('Error retrieving transferts', error);
    }
  );
}

onTransfertPageChange(page: number): void {
  this.currentPageTransferts = page;
  this.fetchTransferts(this.selectedCodemag);
}

onTransfertSearchChange(event: Event): void {
  this.searchQueryTransfert = (event.target as HTMLInputElement).value;
  //this.searchQueryTransfert = event.target.value;
  this.currentPageTransferts = 1; // Reset to first page when searching
  this.fetchTransferts(this.selectedCodemag);

}

onTransfertSortChange(column: string): void {
  if (this.sortByTransferts === column) {
    this.sortOrderTransferts = this.sortOrderTransferts === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortByTransferts = column;
    this.sortOrderTransferts = 'asc';
  }
  this.currentPageTransferts = 1; // Reset to first page on sorting change
  this.fetchTransferts(this.selectedCodemag);
}

fetchTop10SalesByProduct(): void {
  const userData = this.authService.getUserData();
  const headers = new HttpHeaders().set('userid', userData.id.toString()); // Convert userId to string

  let params = new HttpParams();
  if (this.selectedCodemag) {
    params = params.append('codemag', this.selectedCodemag);
  }

  this.http.get<TopSale[]>('http://localhost:3000/topsales', { params, headers })
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

// Define data label formatter function
dataLabelFormatterVBC(tooltipText: any) {
  return   tooltipText +" D";
}

/****Horizental bar chart **/
fetchDataLOYALCUSTOMER(codemag?: string): void {
  const userData = this.authService.getUserData();
  const headers = new HttpHeaders().set('userid', userData.id.toString()); // Convert userId to string

  let params = new HttpParams();

  if (codemag) {
    console.log('codemag front', codemag);
    params = params.set('codemag', codemag);
  }

  this.http.get<any>('http://localhost:3000/NewLoyalCustomer', { params, headers }).subscribe(
    (data: any) => {
      // Once data is retrieved, assign it to the multi array
      this.processData(data);
      this.noDataFound = false; // Reset no data found flag
    },
    (error) => {
      console.error('Error fetching data:', error);
      if (error.status === 404) {
        this.noDataFound = true; // Set no data found flag
        this.errorMessage = 'No Client Types found for the provided codemag';
      } else {
        this.noDataFound = false;
        this.errorMessage = 'An error occurred while fetching data';
      }
    }
  );
}

processData(data: any): void {
    this.single = [
      {
        "name": "New Customers",
        "value": data.newcustomers
      },
      {
        "name": "Normal Customers",
        "value": data.normalcustomers
      },
      {
        "name": "Loyal Customers",
        "value": data.loyalcustomers
      }
    ];

    //console.log('Processed data:', this.single); // Log the processed data
}

onSelect(event): void {
  //console.log('Item clicked', event);
}

onActivate(event): void {
  //console.log('Activate', event);
}

onDeactivate(event): void {
  //console.log('Deactivate', event);
}

fetchTotalClient(): void {
  const userData = this.authService.getUserData();
  const headers = new HttpHeaders().set('userid', userData.id.toString()); // Convert userId to string

  this.http.get<{ customercount: string }>('http://localhost:3000/clientCount',{headers})
    .subscribe(
      (response) => {
        //console.log('Total client API response:', response); // Log the response

        this.totalclient = parseFloat(response.customercount); // Convert to number
        //console.log('Total client:', this.totalclient);
      },
      (error: HttpErrorResponse) => {
        console.error('Error fetching total client:', error);
        this.errorMessage = 'Error fetching total sales. Please try again later.';
      }
    );
}

fetchTotalSales(codemag?: string): void {
  const userData = this.authService.getUserData();
  const headers = new HttpHeaders().set('userid', userData.id.toString()); // Convert userId to string
  console.log(headers);

  let params = new HttpParams()
    .set('type', userData.Type)
    .set('database', userData.baseName)
    .set('startDate', this.startDate || '')  // Ensure startDate and endDate are properly set
    .set('endDate', this.endDate || '');
  if (codemag) {
    params = params.append('codemag', codemag);
  } else {
    params = params.append('codemag', 'All'); // Pass 'All' when no specific codemag is selected
  }
  
  this.http.get<any[]>('http://localhost:3000/totalsales', { params, headers })
    .subscribe(
      (response) => {
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

fetchTotalSalesMonthly(codemag?: string): void {
  const userData = this.authService.getUserData();
  const headers = new HttpHeaders().set('userid', userData.id.toString()); // Convert userId to string

  let params = new HttpParams()
    
  if (codemag) {
    params = params.append('codemag', codemag);
  }else {
    params = params.append('codemag', 'All'); // Pass 'All' when no specific codemag is selected
  }

  this.http.get<TotalSalesResponse>('http://localhost:3000/total-sales-monthly', { params, headers })
    .subscribe(
      (response) => {
        if (response && response.total_sales !== undefined) {
          this.totalSalesMonthly = parseFloat(response.total_sales); // Convert to number
          //console.log("Total Sales Monthly", this.totalSalesMonthly);
        } else {
          this.totalSalesMonthly = 0;  // No data found
          //console.log("Total Sales Monthly is null");
        }
      },
      (error) => {
        console.error('Error fetching total sales:', error);
      }
    );
}

/*******************Out****************/
fetchSalesData(codemag?: string): void {
  const userData = this.authService.getUserData();
  const headers = new HttpHeaders().set('userid', userData.id.toString()); // Convert userId to string

  let url = 'http://localhost:3000/storessales';
  if (codemag) {
    url += `?codemag=${codemag}`;
  }

  this.http.get<any[]>(url,{headers}).subscribe(
    (data) => {
      this.tableData = data;
    },
    (error) => {
      console.error('Error fetching table data:', error);
    }
  );
}



}








