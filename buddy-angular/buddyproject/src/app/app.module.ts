import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SignupComponent } from './pages/signup/signup.component';
import { HomeComponent } from './pages/homes/homes.component';
import { LoginComponent } from './pages/login/login.component';
import { RiderequestComponent } from './pages/riderequest/riderequest.component';
import { GroupComponent } from './pages/group/group.component';
import { GroupviewComponent } from './pages/groupview/groupview.component';
import { SendriderequestComponent } from './pages/sendriderequest/sendriderequest.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { RideTrackingComponent } from './pages/ridetracking/ridetracking.component'; 

@NgModule({
  declarations: [
    AppComponent,
    SignupComponent,
    HomeComponent,
    LoginComponent,
    RiderequestComponent,
    GroupComponent,
    GroupviewComponent,
    SendriderequestComponent,
    NotificationsComponent,
    RideTrackingComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,          // For ngModel
    HttpClientModule ,
    CommonModule     // For HTTP requests
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }