from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import authenticate, get_user_model
from django.utils.translation import gettext_lazy as _
from .models import CustomUser, FavoriteFlavor, Address

# Custom Signup Form
class CustomSignupForm(UserCreationForm):
    email = forms.EmailField(required=True)
    phone = forms.CharField(max_length=15, required=False)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'phone', 'password1', 'password2']
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove help texts
        for fieldname in ['username', 'password1', 'password2']:
            self.fields[fieldname].help_text = ''

User = get_user_model()

class CustomLoginForm(AuthenticationForm):
    username = forms.CharField(label="Username or Email", max_length=150)
    password = forms.CharField(widget=forms.PasswordInput)

    def clean(self):
        username_or_email = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')

        if username_or_email and password:
            user = authenticate(self.request, username=username_or_email, password=password)

            if user is None:
                # Try to treat input as email
                try:
                    user_obj = User.objects.get(email=username_or_email)
                    user = authenticate(self.request, username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass

            if user is None:
                raise forms.ValidationError(_("Invalid credentials. Please try again."))

            self.user_cache = user  # important for form.get_user()

        return self.cleaned_data

    def get_user(self):
        return getattr(self, 'user_cache', None)

class UpdateProfileForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = ['email', 'phone']

class FavoriteFlavorForm(forms.ModelForm):
    class Meta:
        model = FavoriteFlavor
        fields = ['flavor_name']

class AddressForm(forms.ModelForm):
    class Meta:
        model = Address
        fields = ['name', 'phone', 'pin_code', 'state', 'district', 'address']
        widgets = {
            'address': forms.Textarea(attrs={'rows': 2}),
        }