"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: unknown) => void;
          prompt: (callback?: (notification: unknown) => void) => void;
        };
      };
    };
  }
}

export default function GoogleButton({
  label,
  onSuccess,
  onError,
  disabled = false,
}: {
  label: string;
  onSuccess?: (credential: string) => void;
  /** Optional: parent can handle the error (e.g. set page-level error state).
   *  If not provided, the button shows its own inline error message. */
  onError?: (message: string) => void;
  disabled?: boolean;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isConfigured = Boolean(clientId && !clientId.includes("YOUR_"));

  const [inlineError, setInlineError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  function reportError(message: string) {
    if (onError) {
      onError(message);
    } else {
      setInlineError(message);
    }
  }

  useEffect(() => {
    if (!isConfigured) return;

    const scriptId = "google-gsi-script";

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !clientId) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: unknown) => {
          const r = response as { credential?: string };
          if (r?.credential) {
            setInlineError(null);
            onSuccess?.(r.credential);
          } else {
            reportError("Google sign-in was cancelled. Please try again.");
          }
        },
      });

      setScriptReady(true);
    };

    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      initializeGoogle();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => {
      reportError(
        "Could not load Google sign-in. Check your network connection."
      );
    };
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured, clientId]);

  const handleClick = () => {
    setInlineError(null);

    if (!isConfigured) {
      reportError(
        "Google sign-in is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your Vercel environment variables."
      );
      return;
    }

    if (!scriptReady || !window.google?.accounts?.id) {
      reportError("Google sign-in is still loading. Please try again.");
      return;
    }

    window.google.accounts.id.prompt();
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-describedby={inlineError ? "google-btn-error" : undefined}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#1C232E] bg-[#0D1117] px-4 py-3 text-sm font-medium text-[#E8EDF2] transition-colors hover:border-[#2A3340] hover:bg-[#111722] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DFFB8] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {/* Google "G" logo */}
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.98v2.33A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.05l2.99-2.33Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.95l2.99 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
          />
        </svg>
        {label}
      </button>

      {inlineError && (
        <p
          id="google-btn-error"
          role="alert"
          className="mt-2 text-xs text-red-400"
        >
          {inlineError}
        </p>
      )}
    </div>
  );
}
