import axios from "axios"
import { ACCESS_TOKEN } from "@/lib/constants";

const API_BASE_URL: string | undefined = process.env.NEXT_PUBLIC_API_BASE_URL

const api = axios.create({
    baseURL: API_BASE_URL,
}
)

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if(token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    
    (error) =>{
        return Promise.reject(error)
    }
)
export default api
