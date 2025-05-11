from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User

class UserAdmin(BaseUserAdmin):
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
            'fields': ('username', 'password', 'password2', 'role'), 
        }),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
       
    )

    # Указываем поля для ввода пароля при добавлении пользователя
    add_form_template = 'admin/auth/user/add_form.html' 


admin.site.register(User, UserAdmin)


