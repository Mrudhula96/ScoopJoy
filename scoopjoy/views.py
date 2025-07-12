from django.core.mail import send_mail, EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import *
from .models import *
from django.http import JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_protect, csrf_exempt
import json
import logging
from django.db import transaction
from django.db.models import Sum
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse
from django.core.cache import cache
import random
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.forms import SetPasswordForm
from django.core.mail import EmailMultiAlternatives

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

User = get_user_model()

@csrf_exempt
def password_reset(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
            email = data.get('email')
            if not email:
                logger.warning("Password reset attempted with empty email")
                return JsonResponse({'error': 'Email is required'}, status=400)
            
            user = User.objects.get(email=email)
            token = default_token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(str(user.pk)))
            reset_url = request.build_absolute_uri(
                reverse('scoopjoy:password_reset_confirm', kwargs={'uidb64': uidb64, 'token': token})
            )
            send_mail(
                subject='ScoopJoy Password Reset',
                message=f'Click this link to reset your password: {reset_url}',
                from_email='noreply@scoopjoy.com',
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info(f"Password reset email sent to {email}")
            return JsonResponse({'status': 'ok'})
        except json.JSONDecodeError:
            logger.error("Invalid JSON in password reset request")
            return JsonResponse({'error': 'Invalid request data'}, status=400)
        except User.DoesNotExist:
            logger.warning(f"Password reset attempted for non-existent email: {email}")
            return JsonResponse({'error': 'Email not found'}, status=400)
        except Exception as e:
            logger.error(f"Password reset error: {str(e)}", exc_info=True)
            return JsonResponse({'error': 'An error occurred. Please try again.'}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def send_otp(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
            email = data.get('email')
            if not email:
                logger.warning("OTP request attempted with empty email")
                return JsonResponse({'error': 'Email is required'}, status=400)

            # Create user if not exists
            user, created = User.objects.get_or_create(email=email, defaults={'username': email})
            if created:
                logger.info(f"New user created via OTP login: {email}")

            # Generate and send OTP
            otp = str(random.randint(100000, 999999))
            cache.set(f'otp_{email}', otp, timeout=300)  # Store OTP for 5 minutes
            send_mail(
                subject='ScoopJoy OTP Login',
                message=f'Your OTP is: {otp}',
                from_email='noreply@scoopjoy.com',
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info(f"OTP sent to {email}")
            return JsonResponse({'status': 'ok'})

        except json.JSONDecodeError:
            logger.error("Invalid JSON in OTP request")
            return JsonResponse({'error': 'Invalid request data'}, status=400)
        except Exception as e:
            logger.error(f"OTP send error: {str(e)}", exc_info=True)
            return JsonResponse({'error': 'An error occurred. Please try again.'}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def verify_otp(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
            email = data.get('email')
            otp = data.get('otp')
            if not email or not otp:
                logger.warning("OTP verification attempted with missing email or OTP")
                return JsonResponse({'error': 'Email and OTP are required'}, status=400)
            
            stored_otp = cache.get(f'otp_{email}')
            if stored_otp and stored_otp == otp:
                user = User.objects.get(email=email)
                login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                cache.delete(f'otp_{email}')
                logger.info(f"User {email} logged in via OTP")
                return JsonResponse({'status': 'ok'})
            logger.warning(f"Invalid OTP for {email}")
            return JsonResponse({'error': 'Invalid OTP'}, status=400)
        except json.JSONDecodeError:
            logger.error("Invalid JSON in OTP verification request")
            return JsonResponse({'error': 'Invalid request data'}, status=400)
        except User.DoesNotExist:
            logger.warning(f"OTP verification for non-existent email: {email}")
            return JsonResponse({'error': 'User not found'}, status=400)
        except Exception as e:
            logger.error(f"OTP verification error: {str(e)}", exc_info=True)
            return JsonResponse({'error': 'An error occurred. Please try again.'}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def password_reset_confirm(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and default_token_generator.check_token(user, token):
        if request.method == "POST":
            form = SetPasswordForm(user, request.POST)
            if form.is_valid():
                form.save()
                logger.info(f"Password reset successful for user {user.email}")
                return redirect('scoopjoy:login')
            else:
                logger.warning(f"Password reset form invalid for user {user.email}")
                return render(request, 'password_reset_confirm.html', {
                    'form': form,
                    'uidb64': uidb64,
                    'token': token,
                    'errors': form.errors
                })
        else:
            form = SetPasswordForm(user)
            return render(request, 'password_reset_confirm.html', {
                'form': form,
                'uidb64': uidb64,
                'token': token
            })
    logger.warning(f"Invalid password reset token or user: {uidb64}/{token}")
    return render(request, 'password_reset_confirm.html', {
        'error': 'Invalid or expired reset link'
    })

def home_view(request):
    return render(request, 'home.html')

def history_view(request):
    return render(request, 'history.html')

def recipes_view(request):
    return render(request, 'main_page.html')

def recipes(request):
    return render(request, 'recipes.html')

def recipe_detail(request, recipe_id):
    template_name = f'recipes{recipe_id}.html'
    return render(request, template_name)

def signup_view(request):
    if request.method == 'POST':
        form = CustomSignupForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            send_mail(
                subject='Welcome to ScoopJoy!',
                message=f'Hi {user.username},\n\nThanks for signing up at ScoopJoy! 🍦\nWe’re excited to have you.',
                from_email=None,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return redirect('scoopjoy:home')
        else:
            logger.error(f"Signup form errors: {form.errors}")
    else:
        form = CustomSignupForm()
    return render(request, 'signup.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        form = CustomLoginForm(request, data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            next_url = request.GET.get('next', 'scoopjoy:home')
            return redirect(next_url)
        else:
            messages.error(request, "Invalid credentials. Please try again.")
    else:
        form = CustomLoginForm()
    return render(request, 'login.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('scoopjoy:home')

@login_required
def profile_view(request):
    user = request.user
    orders = user.orders.all()
    addresses = Address.objects.filter(user=user)
    if request.method == 'POST':
        update_form = UpdateProfileForm(request.POST, request.FILES, instance=user)
        address_form = AddressForm(request.POST)
        if 'update_profile' in request.POST and update_form.is_valid():
            update_form.save()
            return redirect('scoopjoy:profile')
        if 'add_address' in request.POST:
            address_id = request.POST.get('address_id')
            if address_id:
                address = get_object_or_404(Address, id=address_id, user=user)
                address_form = AddressForm(request.POST, instance=address)
            else:
                address_form = AddressForm(request.POST)
            if address_form.is_valid():
                new_address = address_form.save(commit=False)
                new_address.user = user
                new_address.save()
                return redirect('scoopjoy:profile')
        if 'delete_account' in request.POST:
            user.delete()
            return redirect('scoopjoy:signup')
    else:
        update_form = UpdateProfileForm(instance=user)
        address_form = AddressForm()
    return render(request, 'profile.html', {
        'update_form': update_form,
        'address_form': address_form,
        'orders': orders,
        'addresses': addresses
    })

def quiz_landing(request):
    return render(request, 'quiz_landing.html')

def flavor_quiz(request):
    return render(request, 'flavor_quiz.html')

def sticks(request):
    return render(request, 'iceCreamBars.html')

def cones(request):
    return render(request, 'cones.html')

def tubs(request):
    return render(request, 'tubs.html')

def all_flavors(request):
    return render(request, 'allFlavors.html')

@login_required
def cart_view(request):
    cart_items = CartItem.objects.filter(user=request.user)
    addresses = Address.objects.filter(user=request.user)
    total = sum(item.total_price() for item in cart_items)
    address_form = AddressForm()
    if request.method == 'POST':
        if 'add_address' in request.POST:
            address_form = AddressForm(request.POST)
            if address_form.is_valid():
                new_address = address_form.save(commit=False)
                new_address.user = request.user
                new_address.save()
                return redirect('scoopjoy:cart')
        elif 'update_quantity' in request.POST:
            item_id = request.POST.get('item_id')
            try:
                quantity = int(request.POST.get('quantity'))
            except (TypeError, ValueError):
                quantity = 1
            item = get_object_or_404(CartItem, id=item_id, user=request.user)
            if quantity > 0:
                item.quantity = quantity
                item.save()
            else:
                item.delete()
            return redirect('scoopjoy:cart')
        elif 'remove_item' in request.POST:
            item_id = request.POST.get('item_id')
            item = get_object_or_404(CartItem, id=item_id, user=request.user)
            item.delete()
            return redirect('scoopjoy:cart')
    return render(request, 'cart.html', {
        'cart_items': cart_items,
        'total': total,
        'addresses': addresses,
        'address_form': address_form,
    })

@login_required
@csrf_protect
def update_quantity(request, product_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            action = data.get("action")
            item = CartItem.objects.get(user=request.user, product_id=product_id)
            with transaction.atomic():
                if action == "increment":
                    item.quantity += 1
                    item.save()
                elif action == "decrement":
                    if item.quantity > 1:
                        item.quantity -= 1
                        item.save()
                    else:
                        item.delete()
                        item = None  # Set item to None after deletion
                else:
                    return JsonResponse({"error": "Invalid action"}, status=400)
            total_quantity = CartItem.objects.filter(user=request.user).aggregate(total=Sum('quantity'))['total'] or 0
            # Use 0 for quantity and item_total if item was deleted
            quantity = item.quantity if item else 0
            item_total = item.total_price() if item else 0
            return JsonResponse({
                "message": "Updated",
                "cart_count": total_quantity,
                "quantity": quantity,
                "item_total": item_total
            })
        except CartItem.DoesNotExist:
            return JsonResponse({"error": "Item not found in cart"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=405)

@login_required
@csrf_protect
def add_to_cart(request, product_id):
    if request.method == "POST":
        try:
            product = get_object_or_404(Product, id=product_id)
            with transaction.atomic():
                cart_item, created = CartItem.objects.get_or_create(user=request.user, product=product)
                if not created:
                    cart_item.quantity += 1
                cart_item.save()
                total_quantity = CartItem.objects.filter(user=request.user).aggregate(total=Sum('quantity'))['total'] or 0
                return JsonResponse({
                    "message": "Added",
                    "cart_count": total_quantity,
                    "item_total": cart_item.total_price(),
                    "price": float(product.price)
                })
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid method"}, status=405)

def cart_count(request):
    count = 0
    if request.user.is_authenticated:
        logger.debug("Fetching cart count for user: %s", request.user.username)
        count = CartItem.objects.filter(user=request.user).aggregate(total=Sum('quantity'))['total'] or 0
        logger.debug("Cart count for user %s: %s", request.user.username, count)
    return JsonResponse({"count": count})

@login_required
def cart_items_view(request):
    cart_items = CartItem.objects.filter(user=request.user)
    cart = {str(item.product.id): item.quantity for item in cart_items}
    return JsonResponse({"cart": cart})

@login_required
def checkout_view(request):
    cart_items = CartItem.objects.filter(user=request.user)
    if not cart_items.exists():
        messages.info(request, "Your cart is empty. Add items to proceed to checkout.")
        return redirect('scoopjoy:cart')

    address_form = AddressForm()
    addresses = Address.objects.filter(user=request.user)
    total = sum(item.total_price() for item in cart_items)
    if request.method == 'POST' and 'add_address' in request.POST:
        address_form = AddressForm(request.POST)
        if address_form.is_valid():
            new_address = address_form.save(commit=False)
            new_address.user = request.user
            new_address.save()
            return redirect('scoopjoy:checkout')
    return render(request, 'checkout.html', {
        'cart_items': cart_items,
        'total': total,
        'address_form': address_form,
        'addresses': addresses,
    })

@login_required
def get_address(request, address_id):
    try:
        address = Address.objects.get(id=address_id, user=request.user)
        return JsonResponse({
            "full_name": address.name,
            "phone": address.phone,
            "street": address.state,
            "city": address.district,
            "pincode": address.pin_code,
        })
    except Address.DoesNotExist:
        return JsonResponse({"error": "Address not found"}, status=404)

@login_required
def delete_address(request, address_id):
    try:
        address = get_object_or_404(Address, id=address_id, user=request.user)
        address.delete()
        return redirect('scoopjoy:profile')
    except Address.DoesNotExist:
        return redirect('scoopjoy:profile')

@login_required
def place_order(request):
    if request.method == 'POST':
        logger.debug("POST request received to place order for user %s", request.user.id)
        address_id = request.POST.get('selected_address')
        if not address_id:
            return JsonResponse({'error': 'No address selected'}, status=400)

        try:
            address = Address.objects.get(id=address_id, user=request.user)
        except Address.DoesNotExist:
            return JsonResponse({'error': 'Address not found'}, status=404)

        with transaction.atomic():
            cart_items = CartItem.objects.filter(user=request.user).select_for_update()
            logger.debug("Cart items for user %s: %s", request.user.id, list(cart_items.values()))
            if not cart_items.exists():
                return JsonResponse({'error': 'Cart is empty'}, status=400)

            # Create order
            order = Order.objects.create(user=request.user, address=address)
            order_items = []
            total_price = 0
            for item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    total_price=item.total_price()
                )
                order_items.append(item)
                total_price += item.total_price()

            # Clear cart
            cart_items.delete()
            logger.info(f"Order #{order.id} created for {request.user.username}")

        # Prepare email context
        context = {
            'user': request.user,
            'items': [
                {
                    'product': item.product,
                    'quantity': item.quantity,
                    'total_price': item.total_price()
                } for item in order_items
            ],
            'total': total_price,
            'address': address
        }

        subject = f"Your ScoopJoy Order #{order.id} Confirmation"
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = [request.user.email]

        text_content = f"Hi {request.user.username}, your order has been placed. Total: ₹{total_price}"
        html_content = render_to_string("order_confirmation.html", context)

        msg = EmailMultiAlternatives(subject, text_content, from_email, to_email)
        msg.attach_alternative(html_content, "text/html")
        msg.send()

        return JsonResponse({'success': True, 'order_id': order.id})

    return JsonResponse({'error': 'Invalid request'}, status=400)

@login_required
def orders_view(request):
    orders = request.user.orders.prefetch_related('items__product').order_by('-ordered_at')
    return render(request, 'orders.html', {'orders': orders})

def product_detail(request, id):
    product = get_object_or_404(Product, id=id)
    cart_item = None
    if request.user.is_authenticated:
        cart_item = CartItem.objects.filter(user=request.user, product=product).first()
    return render(request, 'product_detail.html', {
        'product': product,
        'cart_item': cart_item,
    })

def search_api(request):
    query = request.GET.get("q", "").strip()
    results = []
    if query:
        matches = Product.objects.filter(name__icontains=query)[:5]
        results = [
            {"name": p.name, "url": p.get_absolute_url()} for p in matches
        ]
    return JsonResponse({"results": results})

def check_auth(request):
    return JsonResponse({"is_authenticated": request.user.is_authenticated})

def products_api(request):
    category = request.GET.get('category', None)
    print(f"Category received: {category}")  # Debug line
    if category:
        products = Product.objects.filter(category=category)
    else:
        products = Product.objects.all()
    print(f"Number of products returned: {products.count()}")  # Debug line
    products_data = [
        {
            'id': p.id,
            'name': p.name,
            'price': float(p.price),
            'image': p.image.url if p.image else '',
            'category': p.category,  # Added for debugging
        } for p in products
    ]
    return JsonResponse({'products': products_data})

def menu_page(request):
    flat_products = Product.objects.all()[:36]  # Ensure 36 products
    products = [flat_products[i:i+2] for i in range(0, len(flat_products), 2)]
    return render(request, 'menu.html', {'products': products})