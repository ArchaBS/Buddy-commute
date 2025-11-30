from django.contrib import admin
from .models import Riderequest,Profile,Group,Rideresponse,Notification,Location

admin.site.register(Profile)
admin.site.register(Group)
admin.site.register(Riderequest)
admin.site.register(Rideresponse)
admin.site.register(Notification)
admin.site.register(Location)
