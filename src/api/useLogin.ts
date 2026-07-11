import { useMutation } from '@tanstack/react-query';
import { apiClient } from './client';
import { setSession, type AuthUser } from './auth';

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export function useLogin() {
  return useMutation({
    mutationFn: async (vars: { email: string; password: string }) =>
      (await apiClient.post<LoginResponse>('/api/auth/login', vars)).data,
    onSuccess: (data) => {
      setSession({ token: data.token, user: data.user });
    },
  });
}
