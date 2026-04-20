import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  createExpense,
  createParseExpenseJob,
  deleteExpense,
  getParseExpenseJob,
  listExpenses,
  updateExpense,
} from '@/src/lib/data';
import type {ExpenseFilters, ExpenseInput} from '@/src/types';

export function useExpenses(userId: string, filters: ExpenseFilters) {
  return useQuery({
    queryKey: ['expenses', userId, filters],
    queryFn: () => listExpenses(userId, filters),
    enabled: Boolean(userId),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateExpense(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseInput) => createExpense(userId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['expenses', userId]});
      void queryClient.invalidateQueries({queryKey: ['dashboard', userId]});
      void queryClient.invalidateQueries({queryKey: ['subscription-candidates', userId]});
    },
  });
}

export function useUpdateExpense(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: ExpenseInput}) => updateExpense(userId, id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['expenses', userId]});
      void queryClient.invalidateQueries({queryKey: ['dashboard', userId]});
      void queryClient.invalidateQueries({queryKey: ['subscription-candidates', userId]});
    },
  });
}

export function useDeleteExpense(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpense(userId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['expenses', userId]});
      void queryClient.invalidateQueries({queryKey: ['dashboard', userId]});
      void queryClient.invalidateQueries({queryKey: ['subscription-candidates', userId]});
    },
  });
}

export function useCreateParseJob(userId: string) {
  return useMutation({
    mutationFn: (file: File) => createParseExpenseJob(userId, file),
  });
}

export function useParseJob(userId: string, jobId: string | null) {
  return useQuery({
    queryKey: ['parse-job', userId, jobId],
    queryFn: () => getParseExpenseJob(userId, jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      if (query.state.error) {
        return false;
      }
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 1200;
    },
  });
}
