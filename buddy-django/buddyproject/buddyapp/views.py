from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from rest_framework.parsers import JSONParser
from django.http.response import JsonResponse
from buddyapp.serializers import Profileserializer,Groupserializer,Riderequestserializer,Rideresponseserializer,Notificationserializer,Locationserializer
from buddyapp.models import Profile,Group,Riderequest,Rideresponse,Notification,Location
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
import json

@csrf_exempt
def profilelist(request):
    if request.method=="GET":
        profiles= Profile.objects.all()
        profile_Serializer= Profileserializer(profiles,many=True)
        return JsonResponse(profile_Serializer.data,safe=False)
    elif request.method=="POST":
        profile_data=JSONParser().parse(request)
        profile_Serializer=Profileserializer(data=profile_data)
        if profile_Serializer.is_valid():
            profile_Serializer.save()
            return JsonResponse(profile_Serializer.data,safe=False)
    return JsonResponse("failed to add",safe=False)
@csrf_exempt
def profiledetail(request,pk):
    try:
        profile=Profile.objects.get(pk=pk)
    except Profile.DoesNotExist:
        return JsonResponse({'error':'profile not found'},status=404)
    if request.method =="GET":
        profile_Serializer=Profileserializer(profile)
        return JsonResponse(profile_Serializer.data,safe=False)
    elif request.method=="PUT":
        profile_data=JSONParser().parse(request)
        profile_Serializer=Profileserializer(Profile,data=profile_data)
        if profile_Serializer.is_valid():
            profile_Serializer.save()
            return JsonResponse(profile_Serializer.data)
        return JsonResponse("failed to add",safe=False)
    elif request.method=="DELETE":
           Profile.delete()
           return JsonResponse({'message':'Profile delected successfully'},status=404) 




@csrf_exempt
def grouplist(request):
    if request.method == "GET":
        # Force recreate groups if they have no members (add ?reset=true to URL)
        reset = request.GET.get('reset', 'false')
        
        if reset == 'true' or Group.objects.count() == 0:
            print("🔄 Resetting groups and creating test users...")
            
            # Delete all existing groups
            Group.objects.all().delete()
            print("✓ Deleted old groups")
            
            # Create test users first
            test_users_data = [
                {'username': 'django_user', 'email': 'django@test.com', 'password': 'Pass123!', 'phone': '9876543210'},
                {'username': 'vishnu_user', 'email': 'vishnu@test.com', 'password': 'Pass123!', 'phone': '9876543211'},
                {'username': 'amina_user', 'email': 'amina@test.com', 'password': 'Pass123!', 'phone': '9876543212'},
                {'username': 'chandini_user', 'email': 'chandini@test.com', 'password': 'Pass123!', 'phone': '9876543213'},
                {'username': 'pooja_user', 'email': 'pooja@test.com', 'password': 'Pass123!', 'phone': '9876543214'},
            ]
            
            created_users = []
            for user_data in test_users_data:
                # Check if user already exists
                if User.objects.filter(username=user_data['username']).exists():
                    user = User.objects.get(username=user_data['username'])
                    created_users.append(user)
                    print(f"✓ Using existing user: {user.username}")
                else:
                    # Create user
                    user = User.objects.create_user(
                        username=user_data['username'],
                        email=user_data['email'],
                        password=user_data['password']
                    )
                    # Create profile
                    Profile.objects.create(
                        user=user,
                        phone=user_data['phone'],
                        location='Test Location',
                        is_available=True
                    )
                    created_users.append(user)
                    print(f"✓ Created test user: {user.username}")
            
            # Get current user if exists
            all_users = list(User.objects.all())
            
            # Create default groups with members
            default_groups_data = [
                {
                    'groupname': 'Office Group',
                    'description': 'Colleagues commuting to work',
                    'member_usernames': ['django_user', 'vishnu_user', 'amina_user', 'chandini_user']
                },
                {
                    'groupname': 'College Group',
                    'description': 'University friends carpooling',
                    'member_usernames': ['pooja_user', 'vishnu_user', 'amina_user', 'chandini_user']
                },
                {
                    'groupname': 'Homies',
                    'description': 'Fitness enthusiasts workout carpool',
                    'member_usernames': ['django_user', 'chandini_user', 'pooja_user']
                },
                {
                    'groupname': 'Neighborhood Group',
                    'description': 'Neighbors sharing rides locally',
                    'member_usernames': ['django_user', 'vishnu_user', 'pooja_user', 'amina_user']
                },
                {
                    'groupname': 'Weekend Warriors',
                    'description': 'Friends for weekend outings',
                    'member_usernames': ['vishnu_user', 'chandini_user', 'pooja_user', 'amina_user']
                }
            ]
            
            for group_data in default_groups_data:
                # Create group
                group = Group.objects.create(
                    groupname=group_data['groupname'],
                    description=group_data['description']
                )
                
                # Add members to group
                member_count = 0
                for username in group_data['member_usernames']:
                    try:
                        user = User.objects.get(username=username)
                        group.members.add(user)
                        member_count += 1
                    except User.DoesNotExist:
                        print(f"✗ User {username} not found")
                
                print(f"✓ Created: {group.groupname} with {member_count} members")
            
            print(f"✅ Setup complete! Created {Group.objects.count()} groups")
        
        # Get all groups with member info
        groups = Group.objects.all()
        groups_data = []
        
        for group in groups:
            # Get member usernames
            member_usernames = [m.username for m in group.members.all()]
            
            groups_data.append({
                'id': group.id,
                'groupname': group.groupname,
                'description': group.description,
                'members': list(group.members.values_list('id', flat=True)),
                'member_usernames': member_usernames,
                'member_count': group.members.count(),
                'created_at': group.created_at
            })
        
        return JsonResponse(groups_data, safe=False)
        
    elif request.method == "POST":
        group_data = JSONParser().parse(request)
        group_Serializer = Groupserializer(data=group_data)
        if group_Serializer.is_valid():
            group_Serializer.save()
            return JsonResponse(group_Serializer.data, safe=False)
        return JsonResponse({'error': group_Serializer.errors}, status=400)
@csrf_exempt
def groupdetail(request,pk):
    try:
        group=Group.objects.get(pk=pk)
    except Group.DoesNotexit:
        return JsonResponse({'error':'Group not found'},status=404)
    if request.method=="GET":
        group_Serializer=Groupserializer(group)
        return JsonResponse(group_Serializer.data)
    elif request.method=="PUT":
        group_data=JSONParser().parse(request)
        group_Serializer=Groupserializer(group,data=group_data)
        if group_Serializer.is_valid():
            group_Serializer.save()
            return JsonResponse(group_Serializer.data)
        return JsonResponse("failed to add",safe=False)
    elif request.method=="DELETE":
           Profile.delete()
           return JsonResponse({'message':'group deleted successfully'},status=404) 
    
# RIDEREQUEST CRUD

@csrf_exempt
def riderequestlist(request):
     if request.method=="GET":
        riderequest= Riderequest.objects.all()
        riderequest_Serializer= Riderequestserializer(riderequest,many=True)
        return JsonResponse(riderequest_Serializer.data,safe=False)
     elif request.method=="POST":
        riderequest_data=JSONParser().parse(request)
        riderequest_Serializer=Riderequestserializer(data=riderequest_data)
        if riderequest_Serializer.is_valid():
            riderequest_Serializer.save()
            return JsonResponse(riderequest_Serializer.data,safe=False)
     return JsonResponse({'error': riderequest_Serializer.errors}, status=400)

@csrf_exempt
def riderequestdetail(request,pk):
    try:
        riderequest=Riderequest.objects.get(pk=pk)
    except Riderequest.DoesNotexit:
        return JsonResponse({'error':'no request was found'},status=404)
    if request.method=="GET":
        riderequest_Serializer=Riderequestserializer(riderequest)
        return JsonResponse(riderequest_Serializer.data)
    elif request.method=="PUT":
        riderequest_data=JSONParser().parse(request)
        riderequest_Serializer=Riderequestserializer(riderequest,data=riderequest_data)
        if riderequest_Serializer.is_valid():
            riderequest_Serializer.save()
            return JsonResponse(riderequest_Serializer.data)
        return JsonResponse("failed to add",safe=False)
    elif request.method=="DELETE":
           Profile.delete()
           return JsonResponse({'message':'request was deleted successfully'},status=404) 
    
# RIDERESPONSE CRUD

@csrf_exempt
def rideresponselist(request):
     if request.method=="GET":
        rideresponse= Rideresponse.objects.all()
        rideresponse_Serializer= Rideresponseserializer(rideresponse,many=True)
        return JsonResponse(rideresponse_Serializer.data,safe=False)
     elif request.method=="POST":
        rideresponse_data=JSONParser().parse(request)
        rideresponse_Serializer=Rideresponseserializer(data=rideresponse_data)
        if rideresponse_Serializer.is_valid():
            rideresponse_Serializer.save()
            return JsonResponse(rideresponse_Serializer.data,safe=False)
     return JsonResponse({'error': rideresponse_Serializer.errors}, status=400)

@csrf_exempt
def rideresponsedetail(request,pk):
    try:
        rideresponse=Rideresponse.objects.get(pk=pk)
    except Rideresponse.DoesNotexit:
        return JsonResponse({'error':'no response received'},status=404)
    if request.method=="GET":
        rideresponse_Serializer=Rideresponseserializer(rideresponse)
        return JsonResponse(rideresponse_Serializer.data)
    elif request.method=="PUT":
        rideresponse_data=JSONParser().parse(request)
        rideresponse_Serializer=Rideresponseserializer(rideresponse,data=rideresponse_data)
        if rideresponse_Serializer.is_valid():
            rideresponse_Serializer.save()
            return JsonResponse(rideresponse_Serializer.data)
        return JsonResponse("failed to add",safe=False)
    elif request.method=="DELETE":
           Profile.delete()
           return JsonResponse({'message':'response was deleted successfully'},status=404)
    
# NOTIFICATION CRUD

@csrf_exempt
def Notificationlist(request):
     if request.method=="GET":
        notification= Notification.objects.all()
        notification_Serializer= Notificationserializer(notification,many=True)
        return JsonResponse(notification_Serializer.data,safe=False)
     elif request.method=="POST":
        notification_data=JSONParser().parse(request)
        notification_Serializer=Notificationserializer(data=notification_data)
        if notification_Serializer.is_valid():
            notification_Serializer.save()
            return JsonResponse(notification_Serializer.data,safe=False)
     return JsonResponse({'error': notification_Serializer.errors}, status=400)

@csrf_exempt
def notificationdetail(request,pk):
    try:
        notification=Notification.objects.get(pk=pk)
    except Notification.DoesNotexit:
        return JsonResponse({'error':'no notification received'},status=404)
    if request.method=="GET":
        notification_Serializer=Notificationserializer(notification)
        return JsonResponse(notification_Serializer.data)
    elif request.method=="PUT":
        notification_data=JSONParser().parse(request)
        notification_Serializer=Notificationserializer(notification,data=notification_data)
        if notification_Serializer.is_valid():
            notification_Serializer.save()
            return JsonResponse(notification_Serializer.data)
        return JsonResponse("failed to add",safe=False)
    elif request.method=="DELETE":
           Profile.delete()
           return JsonResponse({'message':'notification was deleted successfully'},status=404)
    
#LOCATION CRUD
    
@csrf_exempt
def locationlist(request):
     if request.method=="GET":
        location= Location.objects.all()
        location_serilaizer= Locationserializer(location,many=True)
        return JsonResponse(location_serilaizer.data,safe=False)
     elif request.method=="POST":
        location_data=JSONParser().parse(request)
        location_serilaizer=Locationserializer(data=location_data)
        if location_serilaizer.is_valid():
            location_serilaizer.save()
            return JsonResponse(location_serilaizer.data,safe=False)
     return JsonResponse({'error': location_serilaizer.errors}, status=400)

@csrf_exempt
def locationdetail(request,pk):
    try:
        location=Location.objects.get(pk=pk)
    except location.DoesNotexit:
        return JsonResponse({'error':'no location received'},status=404)
    if request.method=="GET":
        location_serilaizer=Locationserializer(location)
        return JsonResponse(location_serilaizer.data)
    elif request.method=="PUT":
        location_data=JSONParser().parse(request)
        location_serilaizer=Locationserializer(location,data=location_data)
        if location_serilaizer.is_valid():
            location_serilaizer.save()
            return JsonResponse(location_serilaizer.data)
        return JsonResponse("failed to add",safe=False)
    elif request.method=="DELETE":
           Profile.delete()
           return JsonResponse({'message':'location was deleted successfully'},status=404)
    

# SIGNUP FUNCTION
@csrf_exempt
def registeruser(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            phone = data.get('phone')
            
            print(f"📝 Registration attempt: {username}, {email}, {phone}")
            
            # Validate required fields
            if not username or not email or not password or not phone:
                return JsonResponse({
                    'message': 'All fields are required'
                }, status=400)
            
            # Check if username already exists
            if User.objects.filter(username=username).exists():
                return JsonResponse({
                    'message': 'Username already exists'
                }, status=400)
            
            # Check if email already exists
            if User.objects.filter(email=email).exists():
                return JsonResponse({
                    'message': 'Email already registered'
                }, status=400)
            
            # Check if phone already exists
            if Profile.objects.filter(phone=phone).exists():
                return JsonResponse({
                    'message': 'Phone number already registered'
                }, status=400)
            
            # Create new user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
             # Create profile with phone number
            Profile.objects.create(
                user=user,
                phone=phone,
                
            )
            
            print(f"✓ User created successfully: {user.username} - {phone}")
            
            return JsonResponse({
                'message': 'Registration successful!',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'phone': phone
                }
            }, status=201)
                
        except json.JSONDecodeError:
            return JsonResponse({
                'message': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({
                'message': f'Server error: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'message': 'Only POST method allowed'
    }, status=405)


# LOGIN FUNCTION ← YOU NEED THIS!
@csrf_exempt
def loginuser(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            username = data.get('username')
            password = data.get('password')
            
            print(f"🔐 Login attempt: {username}")
            
            # Validate required fields
            if not username or not password:
                return JsonResponse({
                    'message': 'Username and password are required'
                }, status=400)
            
            # Authenticate user
            user = authenticate(username=username, password=password)
            
            if user is not None:
                # User exists and password is correct
                print(f"✓ Login successful: {user.username}")
                
                return JsonResponse({
                    'message': 'Login successful!',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    }
                }, status=200)
            else:
                # Invalid credentials
                print(f"✗ Invalid credentials for: {username}")
                return JsonResponse({
                    'message': 'Invalid username or password'
                }, status=401)
                
        except json.JSONDecodeError:
            return JsonResponse({
                'message': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({
                'message': f'Server error: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'message': 'Only POST method allowed'
    }, status=405)

# Add this to your existing views.py file

@csrf_exempt
def group_details_with_members(request, pk):
    """Get group details including all members"""
    try:
        group = Group.objects.get(pk=pk)
    except Group.DoesNotExist:
        return JsonResponse({'error': 'Group not found'}, status=404)
    
    if request.method == "GET":
        # Get all members of this group
        members = group.members.all()
        members_data = []
        
        for member in members:
            try:
                profile = member.profile
                phone = profile.phone
            except Profile.DoesNotExist:
                phone = ''
            
            members_data.append({
                'id': member.id,
                'username': member.username,
                'phone': phone,
                'email': member.email
            })
        
        response_data = {
            'id': group.id,
            'groupname': group.groupname,
            'description': group.description,
            'created_at': group.created_at,
            'member_count': members.count(),
            'members': members_data,
            'active_rides': 0  # You can calculate this based on your Riderequest model
        }
        
        return JsonResponse(response_data, safe=False)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def search_user_by_phone(request):
    """Search for a user by phone number"""
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            phone = data.get('phone', '').strip()
            
            if not phone:
                return JsonResponse({'error': 'Phone number is required'}, status=400)
            
            # Search for user by phone
            try:
                profile = Profile.objects.get(phone=phone)
                user = profile.user
                
                return JsonResponse({
                    'found': True,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'phone': profile.phone,
                        'email': user.email
                    }
                }, status=200)
                
            except Profile.DoesNotExist:
                return JsonResponse({
                    'found': False,
                    'message': 'No user found with this phone number'
                }, status=200)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Only POST method allowed'}, status=405)


# ADD MEMBER TO GROUP
@csrf_exempt
def add_member_to_group(request, group_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            
            print(f"➕ Request to add user {user_id} to group {group_id}")
            print(f"   Request data: {data}")
            
            if not user_id:
                print(f"✗ Error: user_id is missing")
                return JsonResponse({
                    'message': 'User ID is required'
                }, status=400)
            
            # Get group and user
            try:
                group = Group.objects.get(pk=group_id)
                user = User.objects.get(pk=user_id)
            except Group.DoesNotExist:
                print(f"✗ Error: Group {group_id} not found")
                return JsonResponse({
                    'message': 'Group not found'
                }, status=404)
            except User.DoesNotExist:
                print(f"✗ Error: User {user_id} not found")
                return JsonResponse({
                    'message': 'User not found'
                }, status=404)
            
            # Check if user is already a member
            if group.members.filter(pk=user_id).exists():
                print(f"ℹ️ User {user.username} is already in {group.groupname}")
                return JsonResponse({
                    'message': 'User is already a member of this group'
                }, status=200)
            
            # Add user to group
            group.members.add(user)
            
            print(f"✓ Added {user.username} to group {group.groupname}")
            
            return JsonResponse({
                'message': f'{user.username} added to group successfully!',
                'user': {
                    'id': user.id,
                    'username': user.username
                }
            }, status=200)
            
        except json.JSONDecodeError:
            print(f"✗ Error: Invalid JSON")
            return JsonResponse({
                'message': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            return JsonResponse({
                'message': f'Server error: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'message': 'Only POST method allowed'
    }, status=405)

# SEND RIDE REQUEST TO GROUP
@csrf_exempt
def send_ride_request(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            requester_id = data.get('requester_id')
            group_id = data.get('group_id')
            pickup_location = data.get('pickup_location')
            destination = data.get('destination')
            
            print(f"📤 Ride request from user {requester_id} to group {group_id}")
            
            # ... validation code ...
            
            # Get requester and group
            try:
                requester = User.objects.get(pk=requester_id)
                group = Group.objects.get(pk=group_id)
                
                # 🔍 ADD THESE DEBUG LINES:
                print(f"✅ Found group: {group.groupname}")
                print(f"   Total members in group: {group.members.count()}")
                print(f"   Members: {[m.username for m in group.members.all()]}")
                print(f"   Requester: {requester.username}")
                
            except User.DoesNotExist:
                return JsonResponse({'message': 'User not found'}, status=404)
            except Group.DoesNotExist:
                return JsonResponse({'message': 'Group not found'}, status=404)
            
            # Create ride request
            ride_request = Riderequest.objects.create(
                requester=requester,
                pickup_location=pickup_location,
                destination=destination,
                status='pending'
            )
            
            # Add group to ride request
            ride_request.groups.add(group)
            
            # Create notifications for ALL group members (except requester)
            members = group.members.exclude(pk=requester_id)
            
            # 🔍 ADD THIS DEBUG LINE:
            print(f"   Members to notify (excluding requester): {members.count()}")
            print(f"   Member usernames: {[m.username for m in members]}")
            
            notifications_created = 0
            for member in members:
                Notification.objects.create(
                    receiver=member,
                    message=f"{requester.username} requested a ride from {pickup_location} to {destination}",
                    is_read=False
                )
                notifications_created += 1
            
            print(f"✓ Ride request created. {notifications_created} notifications sent.")
            
            return JsonResponse({
                'message': 'Ride request sent successfully!',
                'ride_request': {
                    'id': ride_request.id,
                    'pickup_location': pickup_location,
                    'destination': destination,
                    'status': ride_request.status
                },
                'notifications_sent': notifications_created
            }, status=201)
            
        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({
                'message': f'Server error: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'message': 'Only POST method allowed'
    }, status=405)


# ACCEPT RIDE REQUEST
@csrf_exempt
def accept_ride_request(request, request_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            responder_id = data.get('responder_id')
            
            print(f"✅ User {responder_id} accepting request {request_id}")
            
            try:
                ride_request = Riderequest.objects.get(pk=request_id)
                responder = User.objects.get(pk=responder_id)
            except Riderequest.DoesNotExist:
                return JsonResponse({'message': 'Ride request not found'}, status=404)
            except User.DoesNotExist:
                return JsonResponse({'message': 'User not found'}, status=404)
            
            if ride_request.status != 'pending':
                return JsonResponse({
                    'message': 'This ride request has already been accepted by someone else'
                }, status=400)
            
            # Create ride response
            ride_response = Rideresponse.objects.create(
                ride_request=ride_request,
                responder=responder,
                response='accepted'
            )
            
            # ✅ UPDATE: Save accepter and change status to in_progress
            ride_request.status = 'in_progress'
            ride_request.accepter = responder
            ride_request.save()
            
            # Notify other members
            all_groups = ride_request.groups.all()
            all_members = User.objects.filter(user_group__in=all_groups).distinct()
            other_members = all_members.exclude(pk__in=[responder_id, ride_request.requester.id])
            
            cancelled_count = 0
            for member in other_members:
                Notification.objects.create(
                    receiver=member,
                    message=f"The ride request from {ride_request.requester.username} has been accepted by {responder.username}",
                    is_read=False
                )
                cancelled_count += 1
            
            # Notify requester
            # Create notification for the original requester with ride ID
            requester = ride_request.requester
            Notification.objects.create(
                 receiver=requester,
                 message=f"🎉 {responder.username} accepted your ride request from {ride_request.pickup_location} to {ride_request.destination}|RIDE:{ride_request.id}",
                 is_read=False,
                 ride_request=ride_request,
                )
            
            print(f"✓ Request accepted. Status changed to in_progress. Notified {cancelled_count + 1} users")
            
            return JsonResponse({
                'message': 'Ride request accepted successfully!',
                'response': {
                    'id': ride_response.id,
                    'responder': responder.username,
                    'status': 'accepted'
                },
                'ride_request_id': ride_request.id,  # ✅ ADD THIS - needed for tracking
                'notifications_sent': cancelled_count + 1
            }, status=200)
            
        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({'message': f'Server error: {str(e)}'}, status=500)
    
    return JsonResponse({'message': 'Only POST method allowed'}, status=405)


# GET USER NOTIFICATIONS
@csrf_exempt
def get_user_notifications(request, user_id):
    if request.method == 'GET':
        try:
            print(f"📬 Getting notifications for user {user_id}")
            
            # Get user
            try:
                user = User.objects.get(pk=user_id)
            except User.DoesNotExist:
                return JsonResponse({
                    'message': 'User not found'
                }, status=404)
            
            # Get all notifications for this user (newest first)
            notifications = Notification.objects.filter(
                receiver=user
            ).order_by('-created_at')
            
            # Format notifications data
            notifications_data = []
            for notif in notifications:
                notifications_data.append({
                    'id': notif.id,
                    'message': notif.message,
                    'is_read': notif.is_read,
                    'created_at': notif.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })
            
            # Count unread notifications
            unread_count = notifications.filter(is_read=False).count()
            
            print(f"✓ Found {len(notifications_data)} notifications ({unread_count} unread)")
            
            return JsonResponse({
                'notifications': notifications_data,
                'total_count': len(notifications_data),
                'unread_count': unread_count
            }, status=200)
            
        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({
                'message': f'Server error: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'message': 'Only GET method allowed'
    }, status=405)

# MARK NOTIFICATION AS READ
@csrf_exempt
def mark_notification_read(request, notification_id):
    if request.method == 'PUT':
        try:
            print(f"👁️ Marking notification {notification_id} as read")
            
            # Get notification
            try:
                notification = Notification.objects.get(pk=notification_id)
            except Notification.DoesNotExist:
                return JsonResponse({
                    'message': 'Notification not found'
                }, status=404)
            
            # Mark as read
            notification.is_read = True
            notification.save()
            
            print(f"✓ Notification marked as read")
            
            return JsonResponse({
                'message': 'Notification marked as read',
                'notification': {
                    'id': notification.id,
                    'is_read': notification.is_read
                }
            }, status=200)
            
        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({
                'message': f'Server error: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'message': 'Only PUT method allowed'
    }, status=405)

# GET RIDE REQUESTS FOR USER
@csrf_exempt
def get_ride_requests_for_user(request, user_id):
    if request.method == 'GET':
        try:
            print(f"🚗 Getting ride requests for user {user_id}")
            
            # Get user
            try:
                user = User.objects.get(pk=user_id)
            except User.DoesNotExist:
                return JsonResponse({
                    'message': 'User not found'
                }, status=404)
            
            # Get all groups user belongs to
            user_groups = Group.objects.filter(members=user)
            
            # Get all pending ride requests for these groups
            ride_requests = Riderequest.objects.filter(
                groups__in=user_groups,
                status='pending'
            ).exclude(
                requester=user  # Don't show user's own requests
            ).distinct()
            
            # Format ride requests data
            requests_data = []
            for req in ride_requests:
                # Check if user already responded
                already_responded = Rideresponse.objects.filter(
                    ride_request=req,
                    responder=user
                ).exists()
                
                requests_data.append({
                    'id': req.id,
                    'requester': req.requester.username,
                    'requester_id': req.requester.id,
                    'pickup_location': req.pickup_location,
                    'destination': req.destination,
                    'status': req.status,
                    'created_at': req.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'already_responded': already_responded
                })
            
            print(f"✓ Found {len(requests_data)} ride requests")
            
            return JsonResponse({
                'ride_requests': requests_data,
                'total_count': len(requests_data)
            }, status=200)
            
        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({
                'message': f'Server error: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'message': 'Only GET method allowed'
    }, status=405)

# ADD CURRENT USER TO GROUP
@csrf_exempt
def add_current_user_to_group(request, group_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            
            # Get group and user
            group = Group.objects.get(pk=group_id)
            user = User.objects.get(pk=user_id)
            
            # Check if already a member
            if group.members.filter(pk=user_id).exists():
                return JsonResponse({
                    'message': 'You are already a member of this group'
                }, status=200)
            
            # Add user to group
            group.members.add(user)
            
            print(f"✓ Added {user.username} to {group.groupname}")
            
            return JsonResponse({
                'message': f'Successfully joined {group.groupname}!'
            }, status=200)
            
        except Group.DoesNotExist:
            return JsonResponse({'message': 'Group not found'}, status=404)
        except User.DoesNotExist:
            return JsonResponse({'message': 'User not found'}, status=404)
        except Exception as e:
            return JsonResponse({'message': str(e)}, status=500)
    
    return JsonResponse({'message': 'Only POST method allowed'}, status=405)

@csrf_exempt
def decline_ride_request(request, request_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            responder_id = data.get('responder_id')
            
            print(f"❌ User {responder_id} declining request {request_id}")
            
            # Get ride request and responder
            try:
                ride_request = Riderequest.objects.get(pk=request_id)
                responder = User.objects.get(pk=responder_id)
            except Riderequest.DoesNotExist:
                return JsonResponse({
                    'message': 'Ride request not found'
                }, status=404)
            except User.DoesNotExist:
                return JsonResponse({
                    'message': 'User not found'
                }, status=404)
            
            # Create ride response (decline)
            ride_response = Rideresponse.objects.create(
                ride_request=ride_request,
                responder=responder,
                response='declined'
            )
            
            # Notify the requester
            requester = ride_request.requester
            Notification.objects.create(
                receiver=requester,
                message=f"❌ {responder.username} declined your ride request from {ride_request.pickup_location} to {ride_request.destination}",
                is_read=False
            )
            
            print(f"✓ Request declined. Notified requester.")
            
            return JsonResponse({
                'message': 'Ride request declined',
                'response': {
                    'id': ride_response.id,
                    'responder': responder.username,
                    'status': 'declined'
                }
            }, status=200)
            
        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({
                'message': f'Server error: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'message': 'Only POST method allowed'
    }, status=405)

@csrf_exempt
def update_ride_location(request, ride_id):
    """Update user's current location for an active ride"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            latitude = data.get('latitude')
            longitude = data.get('longitude')
            
            if not all([user_id, latitude, longitude]):
                return JsonResponse({'message': 'Missing required fields'}, status=400)
            
            try:
                ride_request = Riderequest.objects.get(pk=ride_id)
                user = User.objects.get(pk=user_id)
            except Riderequest.DoesNotExist:
                return JsonResponse({'message': 'Ride not found'}, status=404)
            except User.DoesNotExist:
                return JsonResponse({'message': 'User not found'}, status=404)
            
            # Update location based on user role
            from django.utils import timezone
            
            if ride_request.requester.id == user_id:
                ride_request.requester_latitude = latitude
                ride_request.requester_longitude = longitude
            elif ride_request.accepter and ride_request.accepter.id == user_id:
                ride_request.accepter_latitude = latitude
                ride_request.accepter_longitude = longitude
            else:
                return JsonResponse({'message': 'User not part of this ride'}, status=403)
            
            ride_request.last_location_update = timezone.now()
            ride_request.save()
            
            print(f"📍 Location updated for {user.username} in ride {ride_id}")
            
            return JsonResponse({
                'message': 'Location updated successfully',
                'timestamp': ride_request.last_location_update.isoformat()
            }, status=200)
            
        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({'message': f'Server error: {str(e)}'}, status=500)
    
    return JsonResponse({'message': 'Only POST method allowed'}, status=405)

@csrf_exempt
def get_active_ride(request, ride_id):
    """Get current ride details including both users' locations"""
    if request.method == 'GET':
        try:
            ride_request = Riderequest.objects.get(pk=ride_id)
            
            requester = ride_request.requester
            accepter = ride_request.accepter
            
            response_data = {
                'id': ride_request.id,
                'status': ride_request.status,
                'pickup_location': ride_request.pickup_location,
                'destination': ride_request.destination,
                'created_at': ride_request.created_at.isoformat(),
                'requester': {
                    'id': requester.id,
                    'username': requester.username,
                    'latitude': ride_request.requester_latitude,
                    'longitude': ride_request.requester_longitude
                },
                'accepter': None
            }
            
            if accepter:
                response_data['accepter'] = {
                    'id': accepter.id,
                    'username': accepter.username,
                    'latitude': ride_request.accepter_latitude,
                    'longitude': ride_request.accepter_longitude
                }
            
            return JsonResponse(response_data, status=200)
            
        except Riderequest.DoesNotExist:
            return JsonResponse({'message': 'Ride not found'}, status=404)
        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({'message': f'Server error: {str(e)}'}, status=500)
    
    return JsonResponse({'message': 'Only GET method allowed'}, status=405)

@csrf_exempt
def cancel_ride(request, ride_id):
    """Cancel an active ride"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            
            try:
                ride_request = Riderequest.objects.get(pk=ride_id)
                user = User.objects.get(pk=user_id)
            except Riderequest.DoesNotExist:
                return JsonResponse({'message': 'Ride not found'}, status=404)
            except User.DoesNotExist:
                return JsonResponse({'message': 'User not found'}, status=404)
            
            # Check if user is part of the ride
            if ride_request.requester.id != user_id and (not ride_request.accepter or ride_request.accepter.id != user_id):
                return JsonResponse({'message': 'User not authorized to cancel this ride'}, status=403)
            
            # Update status
            ride_request.status = 'cancelled'
            ride_request.save()
            
            # Notify the other user
            if ride_request.requester.id == user_id:
                # Requester cancelled
                other_user = ride_request.accepter
                message = f"{user.username} cancelled the ride from {ride_request.pickup_location} to {ride_request.destination}"
            else:
                # Accepter cancelled
                other_user = ride_request.requester
                message = f"{user.username} cancelled the ride from {ride_request.pickup_location} to {ride_request.destination}"
            
            if other_user:
                Notification.objects.create(
                    receiver=other_user,
                    message=message,
                    is_read=False
                )
            
            print(f"❌ Ride {ride_id} cancelled by {user.username}")
            
            return JsonResponse({
                'message': 'Ride cancelled successfully'
            }, status=200)
            
        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({'message': f'Server error: {str(e)}'}, status=500)
    
    return JsonResponse({'message': 'Only POST method allowed'}, status=405)