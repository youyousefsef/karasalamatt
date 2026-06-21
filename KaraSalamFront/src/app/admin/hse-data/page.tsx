"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken, getRole, logout } from "@/lib/auth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import type { HSEData } from "@/types";

const PAGE_SIZE = 10;

const METRIC_LABELS: Record<string, string> = {
  "صدا": "صدا",
  "نور": "نور",
  "غبار هوا": "غبار هوا",
  "گرما": "گرما",
};

export default function HSEDataAdminPage() {
  const router = useRouter();

  const [data, setData] = useState<HSEData[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isClient, setIsClient] = useState(false);

  const fetchData = useCallback(async (skip = 0) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await api.get<HSEData[]>(
        `/auth/hse_data?skip=${skip}&limit=${PAGE_SIZE}`
      );
      if (Array.isArray(res)) {
        setData(res);
        setHasMore(res.length >= PAGE_SIZE);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت داده");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    const token = getToken();
    const role = getRole();
    if (!token) {
      router.push("/");
      return;
    }
    if (role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchData(0);
  }, [router, fetchData]);

  const goToPage = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage * PAGE_SIZE);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between bg-white px-4 py-4 shadow-sm sm:px-6">
        <h1 className="text-xl font-bold text-dark">داده‌های HSE</h1>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="secondary"
          >
            بازگشت
          </Button>
          <Button onClick={logout} variant="dark">
            خروج
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4 sm:p-6">
        <PageHeader title="داده‌های ثبت شده توسط ناظران" />

        {isLoading && <LoadingSpinner size="lg" />}

        {error && !isLoading && (
          <ErrorMessage
            message={error}
            onRetry={() => fetchData(page * PAGE_SIZE)}
          />
        )}

        {!isLoading && !error && data.length === 0 && (
          <EmptyState message="هیچ داده‌ای ثبت نشده است." />
        )}

        {!isLoading && data.length > 0 && (
          <>
            <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-right">
                    <th className="px-4 py-3 font-medium">ردیف</th>
                    <th className="px-4 py-3 font-medium">شناسه ناظر</th>
                    <th className="px-4 py-3 font-medium">معیار</th>
                    <th className="px-4 py-3 font-medium">مقدار</th>
                    <th className="px-4 py-3 font-medium">تاریخ ثبت</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        {page * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-3">{item.supervisor_id}</td>
                      <td className="px-4 py-3">
                        {METRIC_LABELS[item.metric] || item.metric}
                      </td>
                      <td className="px-4 py-3">{item.value}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {data.map((item) => (
                <Card key={item.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-dark">
                        {METRIC_LABELS[item.metric] || item.metric}
                      </p>
                      <p className="text-xs text-gray-500">
                        مقدار: {item.value}
                      </p>
                      <p className="text-xs text-gray-400">
                        شناسه ناظر: {item.supervisor_id}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {(page > 0 || hasMore) && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  disabled={page === 0}
                  onClick={() => goToPage(page - 1)}
                >
                  قبلی
                </Button>
                <span className="px-3 text-sm text-gray-600">
                  صفحه {page + 1}
                </span>
                <Button
                  variant="secondary"
                  disabled={!hasMore}
                  onClick={() => goToPage(page + 1)}
                >
                  بعدی
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
