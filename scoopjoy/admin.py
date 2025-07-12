from django.contrib import admin
from .models import *
# Register your models here.
admin.site.register(CustomUser)
admin.site.register(FavoriteFlavor)
admin.site.register(Order)
admin.site.register(Product)
admin.site.register(CartItem)
admin.site.register(Address)