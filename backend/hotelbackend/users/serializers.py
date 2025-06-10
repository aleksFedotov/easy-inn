from rest_framework import serializers
from users.models import User,PushToken
# from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

# Получаем кастомную модель пользователя
UserModel = get_user_model()


# --- User Serializer ---

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model.
    Handles serialization and deserialization of user data.
    Includes custom create and update methods for password handling.

    Сериализатор для модели User.
    Обрабатывает сериализацию и десериализацию данных пользователя.
    Включает кастомные методы create и update для обработки пароля.
    """
    # Define the password field as write-only.
    # This means it will be accepted as input but not included in the output data.
    # required=False allows updating a user without providing a new password.
    # Определяем поле password как write_only (только для записи).
    # Это означает, что оно будет приниматься как входные данные, но не включаться в выходные данные.
    # required=False позволяет обновлять пользователя без предоставления нового пароля.
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        # Specify the model the serializer is based on
        # Указываем модель, на которой основан сериализатор
        model = User
        # Define the fields to be included in the serialization/deserialization
        # Определяем поля, которые будут включены в сериализацию/десериализацию
        fields = ['id', 'username', 'role', 'first_name', 'last_name', 'password']
        # Define fields that are included in 'fields' but should only be read from, not written to.
        # 'id' is typically read-only. 
        # Определяем поля, которые включены в 'fields', но должны быть доступны только для чтения, а не для записи.
        # 'id' обычно только для чтения. 
        read_only_fields = ['id']
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True, 'allow_null': True},
            'last_name': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def create(self, validated_data):
        """
        Custom create method to handle password hashing before saving the user.

        Кастомный метод create для обработки хеширования пароля перед сохранением пользователя.
        """
        # Pop the password from validated_data as it needs special handling (hashing)
        # Извлекаем пароль из validated_data, так как он требует специальной обработки (хеширования).
        password = validated_data.pop('password', None)
        if password is None:
            raise serializers.ValidationError({"password": "Password is required for new users."})
        # Create the user instance using the remaining validated data
        # Создаем экземпляр пользователя, используя оставшиеся валидированные данные.
        user = User.objects.create(**validated_data)
        # If a password was provided, set it using set_password (which handles hashing)
        # Если пароль был предоставлен, устанавливаем его с помощью set_password (который обрабатывает хеширование).
        if password is not None:
            user.set_password(password)
        # Save the user instance (this is necessary if set_password was called)
        # Сохраняем экземпляр пользователя (это необходимо, если был вызван set_password).
        user.save()
        # Return the created user instance
        # Возвращаем созданный экземпляр пользователя.
        return user

    def update(self, instance, validated_data):
        """
        Custom update method to handle password hashing when updating a user.

        Кастомный метод update для обработки хеширования пароля при обновлении пользователя.
        """
        # Pop the password from validated_data if it was provided
        # Извлекаем пароль из validated_data, если он был предоставлен.
        password = validated_data.pop('password', None)
        # Call the parent class's update method to handle updating other fields
        # Вызываем метод update родительского класса для обработки обновления других полей.
        user = super().update(instance, validated_data)
        # If a new password was provided, set it using set_password and save the user
        # Если был предоставлен новый пароль, устанавливаем его с помощью set_password и сохраняем пользователя.
        if password is not None:
            user.set_password(password)
            # Save only the password field for efficiency
            # Сохраняем только поле password для эффективности.
            user.save(update_fields=['password'])

        # Return the updated user instance
        # Возвращаем обновленный экземпляр пользователя.
        return user
    
class PushTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushToken
        fields = (
            'id', 
            'token', 
            'user', 
            'created_at', 
            'last_registered_at', 
            'platform'
        )

        read_only_fields = (
            'id',
            'user', 
            'created_at', 
            'last_registered_at'
        ) 