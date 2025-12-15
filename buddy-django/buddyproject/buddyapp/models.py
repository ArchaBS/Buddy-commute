from django.db import models
from django.contrib.auth.models import User,Group

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=15, blank=True, unique=True)
    location=models.CharField(max_length=250)
    is_available=models.BooleanField(default=False)


class Group(models.Model):
    groupname=models.CharField(max_length=100)
    description=models.TextField()
    members=models.ManyToManyField(User,related_name='user_group')
    created_at=models.DateTimeField(auto_now_add=True)

class Riderequest(models.Model):
    requester=models.ForeignKey(User,on_delete=models.CASCADE,related_name='ride_request')
    pickup_location=models.CharField(max_length=100)
    destination=models.CharField(max_length=100)
    status=models.CharField(max_length=20,choices=[
        ('pending','pending'),
        ('accepted','accepted'),
        ('in_progress','in_progress'),  # ✅ ADD THIS
        ('completed','completed'),        # ✅ ADD THIS
        ('cancelled','cancelled')         # ✅ ADD THIS
    ],default='pending')
    groups=models.ManyToManyField(Group,related_name='ride_request')
    created_at=models.DateTimeField(auto_now_add=True)
    
    # ✅ ADD THESE FIELDS
    accepter=models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True,related_name='accepted_rides')
    requester_latitude=models.FloatField(null=True,blank=True)
    requester_longitude=models.FloatField(null=True,blank=True)
    accepter_latitude=models.FloatField(null=True,blank=True)
    accepter_longitude=models.FloatField(null=True,blank=True)
    last_location_update=models.DateTimeField(null=True,blank=True)

class Rideresponse(models.Model):
    ride_request=models.ForeignKey(Riderequest,on_delete=models.CASCADE,related_name='responses')
    responder=models.ForeignKey(User,on_delete=models.CASCADE)
    response=models.CharField(max_length=20,choices=[
        ('accepted','accepted'),
        ('declined','declined')  # ✅ ADD THIS
    ])
    responded_at=models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    receiver=models.ForeignKey(User,on_delete=models.CASCADE,related_name='notifications')
    message=models.CharField(max_length=100)
    is_read=models.BooleanField(default=False)
    created_at=models.DateTimeField(auto_now_add=True)
    ride_request=models.ForeignKey(Riderequest,on_delete=models.CASCADE,null=True,blank=True,related_name='notifications')

class Location(models.Model):
    user=models.ForeignKey(Riderequest,on_delete=models.CASCADE,related_name='location')
    latitude=models.FloatField()
    longitude=models.FloatField()
    updated_at=models.DateTimeField(auto_now_add=True)
