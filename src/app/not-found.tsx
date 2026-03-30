import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium tracking-wide uppercase text-slate-500 dark:text-slate-400">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Page Not Found</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          The page you requested does not exist or may have moved.
        </p>
        <div className="mt-6">
          <Link
            href="/home"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
