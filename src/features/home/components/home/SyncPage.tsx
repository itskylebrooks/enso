import type { Copy } from '@shared/constants/i18n';
import { KeyRound, LogOut, RefreshCw, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from 'react';

type SyncStatus = 'signed-out' | 'idle' | 'syncing' | 'error';

type SyncPageProps = {
  copy: Copy;
  isSignedIn: boolean;
  isAuthBootstrapping: boolean;
  signedInEmail: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: number | null;
  onRequestOtp: (email: string) => Promise<void>;
  onVerifyOtp: (email: string, token: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onSyncNow: () => Promise<void>;
  onRequestDeleteAccount: () => void;
};

export const SyncPage = ({
  copy,
  isSignedIn,
  isAuthBootstrapping,
  signedInEmail,
  syncStatus,
  syncError,
  lastSyncedAt,
  onRequestOtp,
  onVerifyOtp,
  onSignOut,
  onSyncNow,
  onRequestDeleteAccount,
}: SyncPageProps): ReactElement => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

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

  const normalizedSyncError = useMemo(() => {
    if (!syncError || syncError === 'Unauthorized') {
      return null;
    }

    switch (syncError) {
      case 'email rate limit exceeded':
        return copy.syncPage.errorRateLimited;
      case 'The string did not match the expected pattern.':
        return copy.syncPage.errorInvalidServiceResponse;
      case 'Failed to send sign-in email':
        return copy.syncPage.errorSendCodeFailed;
      case 'Code verification failed':
      case 'Invalid login credentials':
      case 'Token has expired or is invalid':
        return copy.syncPage.errorInvalidOrExpiredCode;
      case 'Sync failed':
        return copy.syncPage.errorSyncFailed;
      default:
        return syncError;
    }
  }, [copy.syncPage, syncError]);

  const statusDetails = useMemo(() => {
    const details: Array<{ label: string; value: string; tone?: 'default' | 'error' }> = [
      {
        label: copy.syncPage.emailLabel,
        value: isSignedIn
          ? (signedInEmail ?? copy.syncPage.signedInFallback)
          : copy.syncPage.notSignedIn,
      },
      {
        label: copy.syncPage.lastSyncLabel,
        value:
          isSignedIn && isHydrated && typeof lastSyncedAt === 'number'
            ? new Date(lastSyncedAt).toLocaleString()
            : copy.syncPage.notSyncedYet,
      },
    ];

    if (normalizedSyncError) {
      details.push({
        label: copy.syncPage.errorLabel,
        value: normalizedSyncError,
        tone: 'error',
      });
    }

    return details;
  }, [copy.syncPage, isHydrated, isSignedIn, lastSyncedAt, normalizedSyncError, signedInEmail]);

  const handleRequestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await requestOtp();
  };

  const requestOtp = async () => {
    const trimmedEmail = email.trim();
    setIsSubmitting(true);
    try {
      await onRequestOtp(trimmedEmail);
      setEmail(trimmedEmail);
      setOtpRequested(true);
      setAuthNotice(`Enter the code sent to ${trimmedEmail}.`);
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
      setOtpRequested(false);
      setOtpCode('');
      setAuthNotice(null);
    } catch {
      // Error state is handled by parent sync state.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    onRequestDeleteAccount();
  };

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

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-xl border surface-border surface p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{copy.syncPage.statusTitle}</h2>
              <span className="text-sm text-muted">{statusText}</span>
            </div>

            <dl className="space-y-4">
              {statusDetails.map(({ label, value, tone }) => (
                <div key={label} className="space-y-1">
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd
                    className={
                      tone === 'error'
                        ? 'text-sm break-words text-red-600 dark:text-red-400'
                        : 'text-sm text-foreground break-words'
                    }
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-xl border surface-border surface p-5 space-y-4">
            <h2 className="text-lg font-semibold">{isSignedIn ? 'Actions' : 'Sign in'}</h2>

            {isSignedIn ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    void handleSyncNow();
                  }}
                  disabled={isSubmitting || syncStatus === 'syncing'}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border btn-contrast px-4 py-2 text-sm disabled:opacity-60"
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border btn-tonal surface-hover px-4 py-2 text-sm disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Sign out
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteAccount();
                  }}
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-600 transition hover:bg-red-500/5 disabled:opacity-60 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Delete account
                </button>
              </div>
            ) : isAuthBootstrapping ? (
              <p className="text-sm text-muted">Checking your sign-in session...</p>
            ) : otpRequested ? (
              <div className="space-y-3">
                {authNotice ? <p className="text-sm text-muted">{authNotice}</p> : null}
                <form className="space-y-3" onSubmit={handleVerifyOtp}>
                  <div className="grid gap-2">
                    <label className="text-sm" htmlFor="sync-otp">
                      One-time code
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
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border btn-contrast px-4 py-2 text-sm disabled:opacity-60"
                  >
                    <KeyRound className="h-4 w-4" aria-hidden />
                    Log in with code
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => {
                    void requestOtp();
                  }}
                  disabled={isSubmitting || email.trim().length === 0}
                  className="inline-flex w-full items-center justify-center rounded-lg border btn-tonal surface-hover px-4 py-2 text-sm disabled:opacity-60"
                >
                  Send new code
                </button>
              </div>
            ) : (
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
                  className="inline-flex w-full items-center justify-center rounded-lg border btn-contrast px-4 py-2 text-sm disabled:opacity-60"
                >
                  Send code
                </button>
              </form>
            )}
          </section>

          <section className="rounded-xl border surface-border surface p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-subtle" aria-hidden />
              <h2 className="text-lg font-semibold">{copy.syncPage.overviewTitle}</h2>
            </div>
            <p className="text-sm text-muted leading-relaxed">{copy.syncPage.overviewBody}</p>
          </section>
        </div>
      </div>
    </section>
  );
};
