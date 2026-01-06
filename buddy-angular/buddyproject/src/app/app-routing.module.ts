import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LogoComponent } from './pages/logo/logo.component';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { HomeComponent } from './pages/homes/homes.component';
//import { RiderequestComponent } from './pages/riderequest/riderequest.component';
import { GroupComponent } from './pages/group/group.component';
import { GroupviewComponent } from './pages/groupview/groupview.component';
import { SendriderequestComponent } from './pages/sendriderequest/sendriderequest.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { RideTrackingComponent } from './pages/ridetracking/ridetracking.component';


const routes: Routes = [
  { path: '', component: LogoComponent },           // Start with logo
  { path: 'logo', component: LogoComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent },
  //{ path: 'riderequest', component: RiderequestComponent }, 
  { path: 'group', component: GroupComponent }, 
  { path: 'groupview/:id', component: GroupviewComponent },
  { path: 'sendriderequest/:id', component: SendriderequestComponent },
  { path: 'notifications', component: NotificationsComponent }, 
  { path: 'ride-tracking/:id', component: RideTrackingComponent },
  { path: '**', redirectTo: '/login' }  ,           // Unknown routes go to login
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }