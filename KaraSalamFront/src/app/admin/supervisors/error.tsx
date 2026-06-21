"use client";

export default function SupervisorsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-bold text-dark">خطا</h2>
        <p className="mb-6 text-gray-500">{error.message || "خطایی رخ داده است."}</p>
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          تلاش مجدد
        </button>
      </div>
    </main>
  );
}
