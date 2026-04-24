import Link from "next/link";

export default function SuspendedPage() {
  return (
    <div className="culture-surface min-h-dvh flex items-center justify-center px-5">
      <div className="text-center max-w-sm">
        <div className="c-kicker mb-3" style={{ opacity: 0.65 }}>§ ACCOUNT · SUSPENDED</div>
        <h1 className="c-hero" style={{ fontSize: 48, lineHeight: 0.9 }}>Account Suspended.</h1>
        <p className="c-serif-it mt-3 mb-6" style={{ fontSize: 14 }}>
          Your Culture account has been suspended. This may be due to a
          violation of our community guidelines. If you believe this is an
          error, please contact us.
        </p>
        <div className="space-y-3">
          <a
            href="mailto:support@hubcity.4everforward.net"
            className="c-btn c-btn-primary"
            style={{ display: "block", width: "100%" }}
          >
            Contact Support
          </a>
          <Link
            href="/login"
            className="c-btn c-btn-outline"
            style={{ display: "block", width: "100%" }}
          >
            Sign Out
          </Link>
        </div>
      </div>
    </div>
  );
}
