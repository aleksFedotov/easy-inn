import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';
import api from '../lib/api'; // Импорт вашего экземпляра axios
import { useAuth } from '../context/AuthContext'; // Импорт хука useAuth
import { useRouter } from 'expo-router'; // Импорт useRouter для навигации
import { isAxiosError } from 'axios'; // Для проверки ошибок Axios
import {jwtDecode} from 'jwt-decode'; // Импорт функции декодирования JWT

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Получаем функции login и user из AuthContext
  const { login, user } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true); // Устанавливаем состояние загрузки
    setError(null); // Сбрасываем предыдущие ошибки



    try {
      const response = await api.post('/api/token/', { // Используем /token/ так как baseURL уже настроен
        username: username,
        password: password,
      });


      if (response.status === 200) {
        const { access, refresh } = response.data;
        console.log('Access Token:', access);
        const decoded =  jwtDecode(access);
        console.log("DECODED ACCESS:", decoded);
        // Вызываем функцию login из AuthContext, которая сохранит токены и получит данные пользователя
        await login(access, refresh);

        // После успешного входа и получения данных пользователя, перенаправляем в зависимости от роли
        // Важно: user будет обновлен после await login(access, refresh);
        // Если user еще не обновился, можно добавить небольшую задержку или использовать useEffect в LoginScreen
        // для наблюдения за user из useAuth. Для простоты, пока полагаемся на немедленное обновление.
        // Проверяем роль пользователя
        if (user?.role === 'housekeeper') { // Замените 'housekeeper' на точное значение роли из вашего API
          router.replace('/my-cleaning-task'); // Перенаправляем на страницу задач уборщика
        } else {
          router.replace('/dashboard'); // Перенаправляем на дашборд для других ролей
        }

      } else {
        // Обработка ошибок, если статус ответа не 200
        const errorMessage = response.data?.detail || 'Ошибка входа. Проверьте логин и пароль.';
        setError(errorMessage);
        console.log('Login failed:', response.data);
      }
    } catch (err) {
      // Обработка сетевых ошибок или ошибок от сервера
      let errorMessage = 'Ошибка входа. Проверьте логин и пароль.';
      if (isAxiosError(err)) {
        if (err.response) {
          // Ошибка от сервера (например, 400 Bad Request)
          errorMessage = err.response.data.detail || 'Ошибка входа. Проверьте логин и пароль.';
        } else if (err.request) {
          // Нет ответа от сервера (проблемы с сетью)
          errorMessage = 'Нет ответа от сервера. Проверьте подключение или URL API.';
        } else {
          // Другие ошибки Axios
          errorMessage = 'Ошибка сети или сервера. Пожалуйста, попробуйте позже.';
        }
      } else {
        // Непредвиденные ошибки
        errorMessage = 'Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже.';
      }
      setError(errorMessage);
      console.error('Login error:', err);
      Alert.alert('Ошибка входа', errorMessage); // Показываем ошибку пользователю
    } finally {
      setIsLoading(false); // Снимаем состояние загрузки
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EasyInn</Text>
      {error && <Text style={styles.errorText}>{error}</Text>} {/* Отображение ошибки */}
      <TextInput
        style={styles.input}
        placeholder="Имя пользователя"
        onChangeText={setUsername}
        value={username}
        autoCapitalize="none" // Отключаем автокапитализацию для логина
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль"
        secureTextEntry={true}
        onChangeText={setPassword}
        value={password}
      />
      <Button title={isLoading ? "Вход..." : "Войти"} onPress={handleLogin} disabled={isLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});
