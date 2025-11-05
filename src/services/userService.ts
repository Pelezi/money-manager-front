import apiClient from '@/lib/apiClient';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  firstAccess: boolean;
  locale: string;
  createdAt: string;
}

export const userService = {
  async updateLocale(locale: string): Promise<User> {
    const response = await apiClient.patch('/users/locale', { locale });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/users/me');
    return response.data;
  }
};
