'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../lib/constants'; 
import api from '../lib/api';
import { useRouter } from 'next/navigation';
import axios from 'axios'
import { User, JwtPayload } from '../lib/types';



interface AuthContextType {
  isAuthenticated: boolean; 
  user: User | null; 
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) =>  Promise<void> 
  logout: () => void; 
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter()

  const logout =useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setIsAuthenticated(false);
    setUser(null);
    console.log("User logged out.");
    router.push("/login")
  },[setIsAuthenticated, setUser, router]);



  const fetchUser = useCallback(async () => {
      try {
          const response = await api.get<User>('/api/users/me/'); 

          if (response.status === 200) {
              setUser(response.data); 
              setIsAuthenticated(true);
              console.log("User data fetched successfully.");
          } else {
              
              console.log("Failed to fetch user data. Redirecting to login.");
              logout(); 
          }
      } catch (error) {
          console.error("Error fetching user data:", error);
           if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
               
               console.log("Unauthorized when fetching user data. Token might be invalid.");
           }
          logout(); 
      }
  }, [logout, setIsAuthenticated, setUser]);

  
  const login =useCallback(async (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN, accessToken);
    localStorage.setItem(REFRESH_TOKEN, refreshToken);
  
    await fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem(ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN);

      if (!accessToken) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        console.log("No initial access token found.");
        return;
      }

      try {
        const decodedToken = jwtDecode<JwtPayload>(accessToken);
        const tokenExpiration = decodedToken.exp;
        const now = Date.now() / 1000;

        if (tokenExpiration < now) {
          console.log("Initial access token expired. Attempting to refresh.");
          if (refreshToken) {
            try {
              const response = await api.post('/api/token/refresh/', { refresh: refreshToken });
              if (response.status === 200) {
                const newAccessToken = response.data.access;
                localStorage.setItem(ACCESS_TOKEN, newAccessToken); 
                await fetchUser(); 
                console.log("Token refreshed successfully during initial check. Fetching user data.")
              } else {
                console.log("Failed to refresh token during initial check. Redirecting to login.");
                logout(); 
              }
            } catch (error) {
              console.error("Error refreshing token during initial check:", error);
              logout(); 
            }
          } else {
            console.log("Access token expired and no refresh token found during initial check. Redirecting to login.");
            logout(); 
          }
        } else {
            console.log("Initial access token is valid. Fetching user data.");
            await fetchUser();
        }
      } catch (error) {
        console.error("Error decoding initial access token:", error);
        logout(); 
      } finally {
        setIsLoading(false); 
      }
    };

    checkAuth(); 
  }, [logout,fetchUser]); 


  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
  };


  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Кастомный хук для удобного доступа к контексту
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
