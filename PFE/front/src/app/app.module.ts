import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './theme/shared/shared.module';
import { AdminComponent } from './theme/layouts/admin/admin.component';
import { GuestComponent } from './theme/layouts/guest/guest.component';
import { NavigationComponent } from './theme/layouts/admin/navigation/navigation.component';
import { NavBarComponent } from './theme/layouts/admin/nav-bar/nav-bar.component';
import { NavLeftComponent } from './theme/layouts/admin/nav-bar/nav-left/nav-left.component';
import { NavRightComponent } from './theme/layouts/admin/nav-bar/nav-right/nav-right.component';
import { NavContentComponent } from './theme/layouts/admin/navigation/nav-content/nav-content.component';
import { NavCollapseComponent } from './theme/layouts/admin/navigation/nav-content/nav-collapse/nav-collapse.component';
import { NavGroupComponent } from './theme/layouts/admin/navigation/nav-content/nav-group/nav-group.component';
import { NavItemComponent } from './theme/layouts/admin/navigation/nav-content/nav-item/nav-item.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { PaginationModule } from '../app/demo/pagination/PaginationModule';
import { MatTableModule } from '@angular/material/table';
import { NgApexchartsModule } from 'ng-apexcharts';  // Import NgApexchartsModule
import { RemoveCurrencySymbolPipe } from '../app/demo/authentication/remove-currency-symbol.pipe';
import {  Title } from '@angular/platform-browser';




@NgModule({
  declarations: [
    RemoveCurrencySymbolPipe,
    AppComponent,
    AdminComponent,
    GuestComponent,
    NavigationComponent,
    NavBarComponent,
    NavLeftComponent,
    NavRightComponent,
    NavContentComponent,
    NavCollapseComponent,
    NavGroupComponent,
    NavItemComponent,
  ],
  imports: [
   // NgxGaugeModule,
   // NgChartsModule,
   NgApexchartsModule,
    MatTableModule,
    NgxChartsModule,
    PaginationModule,
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
     ToastrModule.forRoot({
      positionClass: 'toast-top-right',
      timeOut: 2000,
      progressBar: true,
      progressAnimation: 'decreasing',
      closeButton: true,
      preventDuplicates: true
    })
      
    

    
  ],
  //schemas: [CUSTOM_ELEMENTS_SCHEMA], // Here is where you include the CUSTOM_ELEMENTS_SCHEMA
  //providers: [MessageService], // Provide MessageService at the root level
  providers: [Title],
  bootstrap: [AppComponent]
})
export class AppModule {}
