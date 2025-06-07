import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LogIn } from 'lucide-react-native'; // Expo-friendly версия иконки Lucide

const AuthRequiredMessage: React.FC = () => {
  const navigation = useNavigation();

  const handleLoginRedirect = () => {
    navigation.navigate('login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Доступ запрещен</Text>
        <Text style={styles.description}>
          Для просмотра этой страницы необходимо войти в систему.
        </Text>
        <Text style={styles.message}>
          Пожалуйста, войдите в свой аккаунт, чтобы получить доступ к содержимому.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleLoginRedirect}>
          <LogIn color="white" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Войти</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AuthRequiredMessage;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#f9fafb',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});