import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import type { PersonDirectoryEntry } from './types';

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  org: string | null;
  organizations: string[] | null;
  is_active: boolean;
  created_at: string;
}

const AVATAR_COLORS = ['#4f7cff', '#00b894', '#e17055', '#6c5ce7', '#00cec9', '#fdcb6e', '#e84393'];

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U';
}

function avatarBgFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function usePeopleDirectory() {
  return useQuery({
    queryKey: ['people', 'directory'],
    queryFn: async (): Promise<PersonDirectoryEntry[]> => {
      const res = await apiClient.get<{ users: ApiUser[] }>('/api/users');
      return res.data.users.map((user) => ({
        userId: user.id,
        name: user.name,
        initials: initialsFor(user.name),
        avatarBg: avatarBgFor(user.name),
        roles: [user.role],
      }));
    },
  });
}
