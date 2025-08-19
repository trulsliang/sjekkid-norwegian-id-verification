import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { LoginRequest, AdminUser } from "@shared/schema";

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  loginError: Error | null;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isAuthenticated: false,
    isLoggingIn: false,
    loginError: null,
  });

  const queryClient = useQueryClient();

  // Check for existing session on mount
  useEffect(() => {
    const sessionId = localStorage.getItem('adminSessionId');
    const userData = localStorage.getItem('adminUser');
    
    if (sessionId && userData) {
      try {
        const user = JSON.parse(userData);
        setState(prev => ({
          ...prev,
          user,
          isAuthenticated: true,
        }));
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('adminSessionId');
        localStorage.removeItem('adminUser');
      }
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiRequest("POST", "/api/admin/login", credentials);
      return await response.json();
    },
    onMutate: () => {
      setState(prev => ({
        ...prev,
        isLoggingIn: true,
        loginError: null,
      }));
    },
    onSuccess: (data) => {
      // Store session data
      localStorage.setItem('adminSessionId', data.sessionId);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      
      setState(prev => ({
        ...prev,
        user: data.user,
        isAuthenticated: true,
        isLoggingIn: false,
        loginError: null,
      }));
    },
    onError: (error) => {
      setState(prev => ({
        ...prev,
        isLoggingIn: false,
        loginError: error,
      }));
    },
  });

  const login = (credentials: LoginRequest) => {
    loginMutation.mutate(credentials);
  };

  const logout = () => {
    localStorage.removeItem('adminSessionId');
    localStorage.removeItem('adminUser');
    
    setState({
      user: null,
      isAuthenticated: false,
      isLoggingIn: false,
      loginError: null,
    });

    // Clear all queries
    queryClient.clear();
  };

  return {
    ...state,
    login,
    logout,
  };
}