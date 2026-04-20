import {useState} from 'react';
import {BottomSheet} from '@/src/components/BottomSheet';
import {EmptyState} from '@/src/components/EmptyState';
import {GlassCard} from '@/src/components/GlassCard';
import {useAuth} from '@/src/app/session';
import {useI18n} from '@/src/lib/i18n';
import {getTrialUrgency} from '@/src/lib/data';
import {formatCurrency, formatDateTime} from '@/src/lib/utils';
import {useConfirmCandidate, useCreateTrialReminder, useDeleteTrialReminder, useSubscriptionCandidates, useTrialReminders} from '@/src/features/subscriptions/hooks';
import type {SubscriptionCandidate} from '@/src/types';

export function SubscriptionsPage() {
  const {user} = useAuth();
  const {messages, language} = useI18n();
  const [activeCandidate, setActiveCandidate] = useState<SubscriptionCandidate | null>(null);
  const [trialForm, setTrialForm] = useState({
    serviceName: '',
    trialEndsAt: new Date().toISOString().slice(0, 16),
    firstChargeAmount: 0,
    currency: 'USD',
    status: 'active' as const,
  });

  const candidatesQuery = useSubscriptionCandidates(user!.id);
  const trialRemindersQuery = useTrialReminders(user!.id);
  const confirmCandidateMutation = useConfirmCandidate(user!.id);
  const createTrialMutation = useCreateTrialReminder(user!.id);
  const deleteTrialMutation = useDeleteTrialReminder(user!.id);
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{messages.subscriptions}</h1>
        <p className="mt-1 text-sm text-gray-500">{messages.subscriptionsSubtitle}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard>
          <div className="mb-4 text-lg font-semibold text-gray-900">Subscription Candidates</div>
          {candidatesQuery.data?.length ? (
            <div className="space-y-3">
              {candidatesQuery.data.map((candidate) => (
                <button
                  className="flex w-full items-center justify-between rounded-[1.5rem] bg-white/45 px-4 py-4 text-left"
                  key={candidate.id}
                  onClick={() => setActiveCandidate(candidate)}
                >
                  <div>
                    <div className="font-semibold text-gray-900">{candidate.merchant}</div>
                    <div className="text-sm text-gray-500">
                      {candidate.cadenceGuess} • {Math.round(candidate.confidence * 100)}% confidence
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(candidate.latestAmount, 'USD', locale)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title={messages.noCandidates} body="" />
          )}
        </GlassCard>

        <GlassCard>
          <div className="mb-4 text-lg font-semibold text-gray-900">{messages.trialManager}</div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-2xl bg-white/60 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
              placeholder={messages.serviceName}
              value={trialForm.serviceName}
              onChange={(event) => setTrialForm({...trialForm, serviceName: event.target.value})}
            />
            <input
              className="rounded-2xl bg-white/60 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
              type="number"
              step="0.01"
              placeholder={messages.firstChargeAmount}
              value={trialForm.firstChargeAmount}
              onChange={(event) => setTrialForm({...trialForm, firstChargeAmount: Number(event.target.value)})}
            />
            <input
              className="rounded-2xl bg-white/60 px-4 py-3 outline-none ring-pastel-purple focus:ring-2 md:col-span-2"
              type="datetime-local"
              value={trialForm.trialEndsAt}
              onChange={(event) => setTrialForm({...trialForm, trialEndsAt: event.target.value})}
            />
          </div>
          <button
            className="mt-4 w-full rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white"
            onClick={() =>
              void createTrialMutation.mutateAsync({
                ...trialForm,
                trialEndsAt: new Date(trialForm.trialEndsAt).toISOString(),
              })
            }
          >
            {messages.addTrial}
          </button>

          <div className="mt-5 space-y-3">
            {trialRemindersQuery.data?.length ? (
              trialRemindersQuery.data.map((trial) => {
                const urgent = getTrialUrgency(trial.trialEndsAt);
                return (
                  <div
                    className={`rounded-[1.5rem] px-4 py-4 ${
                      urgent ? 'bg-pastel-peach/70' : 'bg-white/45'
                    }`}
                    key={trial.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{trial.serviceName}</div>
                        <div className="text-sm text-gray-500">{formatDateTime(trial.trialEndsAt, locale)}</div>
                      </div>
                      <button
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                        onClick={() => void deleteTrialMutation.mutateAsync(trial.id)}
                      >
                        {messages.delete}
                      </button>
                    </div>
                    <div className="mt-3 text-sm text-gray-700">
                      {formatCurrency(trial.firstChargeAmount, trial.currency, locale)}
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState title={messages.noTrials} body="" />
            )}
          </div>
        </GlassCard>
      </div>

      <BottomSheet open={Boolean(activeCandidate)} onClose={() => setActiveCandidate(null)}>
        <div className="space-y-5">
          <div>
            <div className="text-xl font-semibold text-gray-900">{messages.confirmSubscription}</div>
            <p className="mt-2 text-sm text-gray-500">
              {activeCandidate?.merchant} • {formatCurrency(activeCandidate?.latestAmount ?? 0, 'USD', locale)}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              className="rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white"
              onClick={() => {
                if (!activeCandidate) return;
                void confirmCandidateMutation.mutateAsync({
                  candidateId: activeCandidate.id,
                  action: 'confirm',
                });
                setActiveCandidate(null);
              }}
            >
              {messages.snoozeSixMonths}
            </button>
            <button
              className="rounded-full bg-white px-4 py-3 text-sm font-medium text-gray-800"
              onClick={() => {
                if (!activeCandidate) return;
                void confirmCandidateMutation.mutateAsync({
                  candidateId: activeCandidate.id,
                  action: 'dismiss',
                });
                setActiveCandidate(null);
              }}
            >
              {messages.notSubscription}
            </button>
            <button
              className="rounded-full bg-pastel-peach px-4 py-3 text-sm font-medium text-gray-900"
              onClick={() => {
                if (!activeCandidate) return;
                void confirmCandidateMutation.mutateAsync({
                  candidateId: activeCandidate.id,
                  action: 'flag',
                });
                setActiveCandidate(null);
              }}
            >
              {messages.flagReview}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
