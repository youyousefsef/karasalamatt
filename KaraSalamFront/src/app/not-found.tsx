import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-dark">۴۰۴</h1>
        <p className="mb-6 text-gray-500">صفحه مورد نظر یافت نشد.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </main>
  );
}
