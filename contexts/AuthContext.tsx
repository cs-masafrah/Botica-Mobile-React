import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { authService, Customer } from '@/services/auth';

export const [AuthContext, useAuth] = createContextHook(() => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const checkAuthQuery = useQuery({
    queryKey: ['auth-status'],
    queryFn: async () => {
      const authState = await authService.getStoredAuth();
      if (authState) {
        setCustomer(authState.customer);
        setAccessToken(authState.accessToken);
      }
      return authState;
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await authService.login(email, password);
    },
    onSuccess: (authState) => {
      setCustomer(authState.customer);
      setAccessToken(authState.accessToken);
      console.log('Login successful:', authState.customer.email);
    },
  });

  const signupMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      firstName,
      lastName,
    }: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => {
      return await authService.signup(email, password, firstName, lastName);
    },
    onSuccess: (authState) => {
      setCustomer(authState.customer);
      setAccessToken(authState.accessToken);
      console.log('Signup successful:', authState.customer.email);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) {
        await authService.logout();
      }
    },
    onSuccess: () => {
      setCustomer(null);
      setAccessToken(null);
      console.log('Logout successful');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (input: {
      firstName: string;
      lastName: string;
      email: string;
      gender: 'MALE' | 'FEMALE' | 'OTHER' | string | undefined;
      dateOfBirth?: string | null;            
      phone?: string | null;
      currentPassword?: string;
      newPassword?: string;
      newPasswordConfirmation?: string;
      newsletterSubscriber?: boolean;
      image?: string | null;
    }) => {
      if (!accessToken) throw new Error('Not authenticated');
      return await authService.updateAccount(input);
    },
    onSuccess: (updatedCustomer) => {
      setCustomer(updatedCustomer);
      console.log('Profile updated:', updatedCustomer);
    },
  });

  const isAuthenticated = !!customer && !!accessToken;
  const isLoading = checkAuthQuery.isLoading;

  return {
    customer,
    accessToken,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    signupLoading: signupMutation.isPending,
    logoutLoading: logoutMutation.isPending,
    updateProfileLoading: updateProfileMutation.isPending,
    loginError: loginMutation.error,
    signupError: signupMutation.error,
  };
});