from django.urls import path
from buddyapp import views

urlpatterns = [
    path('profiles/', views.profilelist),
    path('profiles/<int:pk>/', views.profiledetail),

    path('groups/', views.grouplist),
    path('groups/<int:pk>/', views.groupdetail),
    path('groups/<int:pk>/details/', views.group_details_with_members),
    path('groups/<int:group_id>/add-member/', views.add_member_to_group),   # NEW
    path('search-by-phone/', views.search_user_by_phone),  # NEW
    path('groups/<int:group_id>/join/', views.add_current_user_to_group, name='join_group'),
    
    

    path('riderequests/', views.riderequestlist),
    path('riderequests/<int:pk>/', views.riderequestdetail),
    path('ride-requests/accept/<int:request_id>/', views.accept_ride_request, name='accept_ride_request'),
    path('ride-requests/decline/<int:request_id>/', views.decline_ride_request, name='decline_ride_request'),
    path('rides/<int:ride_id>/location/', views.update_ride_location, name='update_ride_location'),
    path('rides/<int:ride_id>/', views.get_active_ride, name='get_active_ride'),
    path('rides/<int:ride_id>/cancel/', views.cancel_ride, name='cancel_ride'),

    path('rideresponses/', views.rideresponselist),
    path('rideresponses/<int:pk>/', views.rideresponsedetail),
    

    path('locations/', views.locationlist),
    path('locations/<int:pk>/', views.locationdetail),

    path('notifications/', views.Notificationlist),
    path('notifications/<int:pk>/', views.notificationdetail),

    path('register/', views.registeruser, name="register"),
    path('login/', views.loginuser, name='login'),
    path('send-ride-request/', views.send_ride_request, name='send_ride_request'),

    # Ride request endpoints
    path('ride-requests/accept/<int:request_id>/', views.accept_ride_request, name='accept_ride_request'),
    path('ride-requests/user/<int:user_id>/', views.get_ride_requests_for_user, name='get_ride_requests_for_user'),
    
    # Notification endpoints
    path('notifications/user/<int:user_id>/', views.get_user_notifications, name='get_user_notifications'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    

]

