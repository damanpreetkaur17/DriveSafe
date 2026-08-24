"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI, saveToken, clearToken, getToken } from "@/services/api";

interface User {
  user_id: number;
  username: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  profile_completed?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (username: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  googleSignIn: (displayName?: string, email?: string, credential?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const GOOGLE_USER_KEY = "google_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const storedGoogleUser = typeof window !== "undefined" ? localStorage.getItem(GOOGLE_USER_KEY) : null;

      if (storedGoogleUser) {
        setUser(JSON.parse(storedGoogleUser));
        return;
      }

      const token = getToken();
      if (token) {
        const response = await authAPI.getMe();
        if (response.success) {
          setUser(response.data);
        } else {
          clearToken();
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      clearToken();
      localStorage.removeItem(GOOGLE_USER_KEY);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void checkAuth();
    });
  }, []);

  const signup = async (username: string, email: string, password: string) => {
    try {
      const response = await authAPI.signup({ username, email, password });
      if (response.success && response.data.token) {
        saveToken(response.data.token);
        setUser(response.data);
      }
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.success && response.data.token) {
        saveToken(response.data.token);
        setUser(response.data);
        return Boolean(response.data.profile_completed);
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const googleSignIn = async (displayName = "Google User", email = "", credential?: string) => {
    try {
      const response = await authAPI.googleLogin({
        credential,
        name: displayName,
        email,
        username: "",
      });

      if (response.success && response.data.token) {
        saveToken(response.data.token);
        const googleUser: User = {
          user_id: response.data.user_id,
          username: response.data.username,
          email: response.data.email,
        };
        localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(googleUser));
        setUser(googleUser);
        return Boolean(response.data.profile_completed);
      }
      return false;
    } catch (error) {
      console.error("Google sign-in failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearToken();
      localStorage.removeItem(GOOGLE_USER_KEY);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signup,
        login,
        googleSignIn,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
