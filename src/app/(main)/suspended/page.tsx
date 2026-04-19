import Link from "next/link";

export default function SuspendedPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-5">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-coral/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">•</span>
        </div>
        <h1 className="font-heading text-2xl font-bold mb-2">Account Suspended</h1>
        <p className="text-sm text-txt-secondary leading-relaxed mb-6">
          Your Knect account has been suspended. This may be due to a
          violation of our community guidelines. If you believe this is an
          error, please contact us.
        </p>
        <div className="space-y-3">
          <a
            href="mailto:support@knect.app"
            className="block w-full py-3 rounded-xl bg-gold/10 text-gold font-bold text-sm"
          >
            Contact Support
          </a>
          <Link
            href="/login"
            className="block w-full py-3 rounded-xl bg-white/5 text-txt-secondary font-medium text-sm"
          >
            Sign Out
          </Link>
        </div>
      </div>
    </div>
  );
}
