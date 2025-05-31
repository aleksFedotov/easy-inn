import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button } from 'react-native';
import api from '../lib/api'; 

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_BASE_URL: string | undefined = Constants.expoConfig?.extra?.apiUrl;


export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
  
    
    try {
      
      console.log('Request body:', JSON.stringify({ username, password }));

      const response = await api.post('/api/token/', {
        username: username,
        password: password,
      });

      

      if (response.status === 200) {
        console.log('Login successful!', response.data);
        // Здесь вы можете сохранить токен (response.data.access) и перейти на следующий экран
        const { access, refresh } = response.data;
         try {
          if (access) {
            await AsyncStorage.setItem('accessToken', access);
            console.log('Access token saved.');
          }
          if (refresh) {
            await AsyncStorage.setItem('refreshToken', refresh);
            console.log('Refresh token saved.');
          }
          // TODO: Перенаправить на следующий экран
        } catch (error) {
          console.error('Error saving tokens:', error);
        }
      } else {
        console.log('Login failed:', response.data);
        // Здесь можно показать сообщение об ошибке пользователю
      }
    } catch (error) {
      console.error('Login error:', error);
      // Здесь можно показать сообщение об ошибке сети или бэкенда
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EasyInn</Text>
      <TextInput
        style={styles.input}
        placeholder="Имя пользователя"
        onChangeText={setUsername}
        value={username}
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль"
        secureTextEntry={true}
        onChangeText={setPassword}
        value={password}
      />
      <Button title="Войти" onPress={handleLogin} />
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
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
});