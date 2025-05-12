from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .forms import CustomUserCreationForm, CustomUserChangeForm

from .models import User

class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm 
    form = CustomUserChangeForm 
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')

    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')

    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    readonly_fields = ('date_joined', 'last_login')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}), 
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}), 
    )

   
    add_fieldsets = (
    (None, {
        'classes': ('wide',),
        'fields': ('username', 'password1', 'password2', 'role'), 
    }),
    ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
)
    




admin.site.register(User, UserAdmin)


