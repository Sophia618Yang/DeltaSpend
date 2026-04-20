import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  confirmSubscriptionCandidate,
  createTrialReminder,
  deleteTrialReminder,
  listSubscriptionCandidates,
  listTrialReminders,
  updateTrialReminder,
} from '@/src/lib/data';
import type {TrialReminderInput} from '@/src/types';

export function useSubscriptionCandidates(userId: string) {
  return useQuery({
    queryKey: ['subscription-candidates', userId],
    queryFn: () => listSubscriptionCandidates(userId),
  });
}

export function useConfirmCandidate(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      candidateId,
      action,
    }: {
      candidateId: string;
      action: 'confirm' | 'dismiss' | 'flag';
    }) => confirmSubscriptionCandidate(userId, candidateId, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['subscription-candidates', userId]});
    },
  });
}

export function useTrialReminders(userId: string) {
  return useQuery({
    queryKey: ['trial-reminders', userId],
    queryFn: () => listTrialReminders(userId),
  });
}

export function useCreateTrialReminder(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TrialReminderInput) => createTrialReminder(userId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['trial-reminders', userId]});
    },
  });
}

export function useUpdateTrialReminder(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: TrialReminderInput}) =>
      updateTrialReminder(userId, id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['trial-reminders', userId]});
    },
  });
}

export function useDeleteTrialReminder(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTrialReminder(userId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['trial-reminders', userId]});
    },
  });
}
