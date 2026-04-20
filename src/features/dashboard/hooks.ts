import {useQuery} from '@tanstack/react-query';
import {getDashboard} from '@/src/lib/data';
import type {DashboardRange} from '@/src/types';

export function useDashboard(userId: string, range: DashboardRange) {
  return useQuery({
    queryKey: ['dashboard', userId, range],
    queryFn: () => getDashboard(userId, range),
    enabled: Boolean(userId),
    placeholderData: (previousData) => previousData,
  });
}
