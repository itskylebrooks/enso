import type { Copy } from '@shared/constants/i18n';
import {
  Gift,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactElement } from 'react';

type SyncStatus = 'signed-out' | 'idle' | 'syncing' | 'error';

type SyncPageProps = {
  copy: Copy;
  isSignedIn: boolean;
  isAuthBootstrapping: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: number | null;
  onRequestOtp: (email: string) => Promise<void>;
  onVerifyOtp: (email: string, token: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onSyncNow: () => Promise<void>;
};

export const SyncPage = ({
  copy,
  isSignedIn,
  isAuthBootstrapping,
  syncStatus,
  syncError,
  lastSyncedAt,
  onRequestOtp,
  onVerifyOtp,
  onSignOut,
  onSyncNow,
}: SyncPageProps): ReactElement => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const renderParagraphs = (text: string) =>
    text.split('\n').map((paragraph, index) => (
      <p key={index} className="text-base leading-relaxed">
        {paragraph}
      </p>
    ));

  const statusText = useMemo(() => {
    if (isAuthBootstrapping) {
      return 'Checking session...';
    }

    if (!isSignedIn) {
      return 'Signed out';
    }

    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Sync error';
      default:
        return 'Ready';
    }
  }, [isAuthBootstrapping, isSignedIn, syncStatus]);

  const lastSyncedText =
    typeof lastSyncedAt === 'number' ? new Date(lastSyncedAt).toLocaleString() : 'Not synced yet';

  const handleRequestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onRequestOtp(email.trim());
      setOtpRequested(true);
      setAuthNotice(
        'Check your inbox for a sign-in link or one-time code. New email addresses create an account automatically.',
      );
    } catch {
      setAuthNotice(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onVerifyOtp(email.trim(), otpCode.trim());
      setOtpCode('');
      setAuthNotice(null);
    } catch {
      // Error state is handled by parent sync state.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSubmitting(true);
    try {
      await onSyncNow();
    } catch {
      // Error state is handled by parent sync state.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    try {
      await onSignOut();
    } catch {
      // Error state is handled by parent sync state.
    } finally {
      setIsSubmitting(false);
    }
  };

  const featureCards = [
    {
      title: copy.syncPage.paidFeatureTitle,
      body: copy.syncPage.paidFeatureBody,
      icon: ShieldCheck,
    },
    {
      title: copy.syncPage.localFirstTitle,
      body: copy.syncPage.localFirstBody,
      icon: Lock,
    },
    {
      title: copy.syncPage.exportImportTitle,
      body: copy.syncPage.exportImportBody,
      icon: Gift,
    },
  ];

  return (
    <section className="pt-0 pb-12 font-sans">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 space-y-8">
        <header className="rounded-2xl border surface-border bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-blue-500/10 p-6 md:p-8 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {copy.syncPage.title}
            </h1>
            <Sparkles className="w-7 h-7 text-subtle shrink-0" aria-hidden />
          </div>
          <div className="space-y-3 text-base md:text-lg text-muted leading-relaxed">
            {renderParagraphs(copy.syncPage.intro)}
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          {featureCards.map(({ title, body, icon: Icon }) => (
            <article
              key={title}
              className="rounded-xl border surface-border surface p-4 space-y-2 card-hover-shadow"
            >
              <Icon className="w-5 h-5 text-subtle" aria-hidden />
              <h2 className="text-base font-semibold leading-tight">{title}</h2>
              <p className="text-sm text-muted leading-relaxed">{body}</p>
            </article>
          ))}
        </div>

        <div className="rounded-xl border surface-border surface p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{copy.syncPage.statusTitle}</h2>
            <span className="text-sm text-muted">{statusText}</span>
          </div>

          <p className="text-sm text-muted">Last synced: {lastSyncedText}</p>

          {syncError ? <p className="text-sm text-red-600 dark:text-red-400">{syncError}</p> : null}
          {authNotice ? <p className="text-sm text-muted">{authNotice}</p> : null}

          {isSignedIn ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleSyncNow();
                }}
                disabled={isSubmitting || syncStatus === 'syncing'}
                className="inline-flex items-center gap-2 rounded-lg border btn-contrast px-4 py-2 text-sm disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                Sync now
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleSignOut();
                }}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg border btn-tonal surface-hover px-4 py-2 text-sm disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </button>
            </div>
          ) : isAuthBootstrapping ? (
            <p className="text-sm text-muted">Checking your sign-in session...</p>
          ) : (
            <div className="space-y-3">
              <form className="space-y-3" onSubmit={handleRequestOtp}>
                <div className="grid gap-2">
                  <label className="text-sm" htmlFor="sync-email">
                    Email
                  </label>
                  <input
                    id="sync-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="w-full rounded-lg border surface-border bg-transparent px-3 py-2 text-sm"
                    autoComplete="email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || email.trim().length === 0}
                  className="inline-flex items-center gap-2 rounded-lg border btn-contrast px-4 py-2 text-sm disabled:opacity-60"
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                  {otpRequested ? 'Resend sign-in email' : 'Send sign-in link or code'}
                </button>
              </form>

              {otpRequested ? (
                <form className="space-y-3" onSubmit={handleVerifyOtp}>
                  <div className="grid gap-2">
                    <label className="text-sm" htmlFor="sync-otp">
                      One-time code (optional)
                    </label>
                    <input
                      id="sync-otp"
                      type="text"
                      value={otpCode}
                      onChange={(event) => setOtpCode(event.target.value)}
                      className="w-full rounded-lg border surface-border bg-transparent px-3 py-2 text-sm"
                      autoComplete="one-time-code"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting || email.trim().length === 0 || otpCode.trim().length === 0
                    }
                    className="inline-flex items-center gap-2 rounded-lg border btn-tonal surface-hover px-4 py-2 text-sm disabled:opacity-60"
                  >
                    <KeyRound className="h-4 w-4" aria-hidden />
                    Verify code and sync
                  </button>
                </form>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-3">{renderParagraphs(copy.syncPage.statusBody)}</div>
      </div>
    </section>
  );
};
