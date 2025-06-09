import axios from "axios"
import { ACCESS_TOKEN } from "./constants";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';


const API_BASE_URL: string | undefined = Constants.expoConfig?.extra?.apiUrl;

const api = axios.create({
    baseURL: API_BASE_URL,
}
)

api.interceptors.request.use(
     async (config) => {
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
              
            } else {
                
            }
        } catch (error) {
            console.error('Error getting access token from AsyncStorage in interceptor:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)
export default api
