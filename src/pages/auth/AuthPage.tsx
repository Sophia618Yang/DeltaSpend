import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {GlassCard} from '@/src/components/GlassCard';
import {useAuth} from '@/src/app/session';
import {useI18n} from '@/src/lib/i18n';

export function AuthPage() {
  const {messages} = useI18n();
  const {signIn, isDemo} = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error'; message: string} | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink/30 via-white/60 to-pastel-blue/30 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard className="overflow-hidden bg-gradient-to-br from-white/65 to-pastel-purple/35">
            <div className="space-y-6 p-4 md:p-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-2xl text-white blob-4">
                △
              </div>
              <div className="space-y-3">
                <div className="text-sm uppercase tracking-[0.25em] text-gray-500">{messages.appName} 1.0</div>
                <h1 className="max-w-xl text-4xl font-bold text-gray-900 md:text-5xl">
                  Expense clarity, dashboard feedback, and subscription guardrails.
                </h1>
                <p className="max-w-xl text-base text-gray-600">{messages.readyForLaunch}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="bg-white/72">
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitting(true);
                setFeedback(null);
                void signIn(email, displayName.trim())
                  .then(() => {
                    if (isDemo) {
                      navigate('/dashboard');
                      return;
                    }
                    setFeedback({type: 'success', message: messages.magicLinkSent});
                  })
                  .catch((error: unknown) => {
                    const message = error instanceof Error && error.message ? error.message : messages.magicLinkError;
                    setFeedback({type: 'error', message});
                  })
                  .finally(() => setSubmitting(false));
              }}
            >
              <div>
                <div className="text-2xl font-bold text-gray-900">{messages.signIn}</div>
                <p className="mt-2 text-sm text-gray-500">{messages.magicLinkHint}</p>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">{messages.name}</span>
                <input
                  className="w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 outline-none ring-pastel-purple transition focus:ring-2"
                  placeholder={messages.namePlaceholder}
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input
                  className="w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 outline-none ring-pastel-purple transition focus:ring-2"
                  placeholder={messages.emailPlaceholder}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <button
                className="w-full rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-70"
                disabled={submitting || !email.trim() || !displayName.trim()}
                type="submit"
              >
                {submitting ? messages.loading : messages.sendMagicLink}
              </button>
              {isDemo ? (
                <div className="rounded-2xl bg-pastel-peach/50 px-4 py-3 text-sm text-gray-700">
                  {messages.demoMode}
                </div>
              ) : null}
              {feedback ? (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    feedback.type === 'success'
                      ? 'bg-pastel-blue/40 text-gray-800'
                      : 'bg-pastel-peach/60 text-gray-800'
                  }`}
                >
                  {feedback.message}
                </div>
              ) : null}
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
