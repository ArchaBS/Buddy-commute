from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Riderequest,Profile,Group,Rideresponse,Notification,Location

class Profileserializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        Profile.objects.create(user=user)
        return user

class Groupserializer(serializers.ModelSerializer):
    members = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    
    class Meta:
        model = Group
        fields = ['id', 'groupname', 'description', 'members', 'created_at']
        
class Riderequestserializer(serializers.ModelSerializer):
    class Meta:
        model=Riderequest
        fields="__all__"

class Rideresponseserializer(serializers.ModelSerializer):
    class Meta:
        model=Rideresponse
        fields="__all__"

class Notificationserializer(serializers.ModelSerializer):
    ride_request_id = serializers.IntegerField(source='ride_request.id', read_only=True, allow_null=True)
    class Meta:
        model=Notification
        fields="__all__"

class Locationserializer(serializers.ModelSerializer):
    class Meta:
        model=Location
        fields="__all__"