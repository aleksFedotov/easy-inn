import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert ,TouchableOpacity} from 'react-native';
import api from '../lib/api'; 
import { useAuth } from '../context/AuthContext'; 
import { useRouter } from 'expo-router'; 
import { isAxiosError } from 'axios'; 
import { USER_ROLES } from '@/lib/constants';
import { FontAwesome } from '@expo/vector-icons';


export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const { login, user } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true); 
    setError(null); 



    try {
      const response = await api.post('/api/token/', { 
        username: username,
        password: password,
      });


      if (response.status === 200) {
        const { access, refresh } = response.data;
        
        await login(access, refresh);

       
        if (user?.role === USER_ROLES.HOUSEKEEPER) { 
          router.replace('/my-cleaning-task'); 
        } else {
          router.replace('/dashboard'); 
        }
       

      } else {
        
        const errorMessage = response.data?.detail || 'Ошибка входа. Проверьте логин и пароль.';
        setError(errorMessage);
        console.log('Login failed:', response.data);
      }
    } catch (err) {
    
      let errorMessage = 'Ошибка входа. Проверьте логин и пароль.';
      if (isAxiosError(err)) {
        if (err.response) {
          errorMessage = err.response.data.detail || 'Ошибка входа. Проверьте логин и пароль.';
        } else if (err.request) {
          errorMessage = 'Нет ответа от сервера. Проверьте подключение или URL API.';
        } else { 
          errorMessage = 'Ошибка сети или сервера. Пожалуйста, попробуйте позже.';
        }
      } else {
        errorMessage = 'Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже.';
      }
      setError(errorMessage);
      console.error('Login error:', err);
      Alert.alert('Ошибка входа', errorMessage); 
    } finally {
      setIsLoading(false); 
    }
  };

  return (
     <View style={styles.container}>
        <Text style={styles.title}>EasyInn</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <TextInput
          style={styles.input}
          placeholder="Имя пользователя"
          onChangeText={setUsername}
          value={username}
          autoCapitalize="none"
        />
        <View style={styles.passwordInputContainer}> 
          <TextInput
            style={styles.passwordInput} 
            placeholder="Пароль"
            secureTextEntry={!showPassword} 
            onChangeText={setPassword}
            value={password}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)} 
            style={styles.eyeIconContainer}
          >
            <FontAwesome
              name={showPassword ? 'eye-slash' : 'eye'} 
              size={20}
              color="gray"
            />
          </TouchableOpacity>
        </View>
        <Button title={isLoading ? 'Вход...' : 'Войти'} onPress={handleLogin} disabled={isLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  passwordInputContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  eyeIconContainer: {
    padding: 10,
  },
});