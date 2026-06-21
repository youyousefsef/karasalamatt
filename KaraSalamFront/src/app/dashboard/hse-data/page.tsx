"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken, getRole, logout } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { showToast } from "@/components/Toast";
import type { HSEData } from "@/types";

const METRICS = [
  { key: "صدا", label: "صدا" },
  { key: "نور", label: "نور" },
  { key: "غبار هوا", label: "غبار هوا" },
  { key: "گرما", label: "گرما" },
] as const;

export default function HSEDataPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("");
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [entries, setEntries] = useState<HSEData[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [entriesError, setEntriesError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<HSEData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEntries = useCallback(async () => {
    setIsLoadingEntries(true);
    setEntriesError("");
    try {
      const data = await api.get<HSEData[]>("/auth/hse_data?skip=0&limit=50");
      if (Array.isArray(data)) setEntries(data);
    } catch (err) {
      setEntriesError(err instanceof Error ? err.message : "خطا در دریافت سابقه");
    } finally {
      setIsLoadingEntries(false);
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
    if (role !== "HSESupervisor") {
      router.push("/dashboard");
      return;
    }
    fetchEntries();
  }, [router, fetchEntries]);

  if (!isClient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedMetric) { setFormError("لطفاً معیار را انتخاب کنید"); return; }
    if (!value.trim()) { setFormError("لطفاً مقدار را وارد کنید"); return; }

    setIsSubmitting(true);
    try {
      await api.post("/auth/hse_data", { metric: selectedMetric, value: value.trim() });
      showToast("داده با موفقیت ثبت شد", "success");
      setValue("");
      setSelectedMetric("");
      await fetchEntries();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "خطا در ثبت داده");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (entry: HSEData) => {
    setEditingId(entry.id);
    setEditValue(entry.value);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleUpdate = async (entryId: number) => {
    if (!editValue.trim()) return;
    setIsUpdating(true);
    try {
      await api.put(`/auth/hse_data/${entryId}`, { value: editValue.trim() });
      showToast("داده با موفقیت ویرایش شد", "success");
      setEditingId(null);
      setEditValue("");
      await fetchEntries();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در ویرایش", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/auth/hse_data/${deleteTarget.id}`);
      showToast("داده با موفقیت حذف شد", "success");
      setDeleteTarget(null);
      await fetchEntries();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در حذف", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("fa-IR", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between bg-white px-4 py-4 shadow-sm sm:px-6">
        <h1 className="text-xl font-bold text-dark">ثبت داده HSE</h1>
        <div className="flex gap-3">
          <Button onClick={() => router.push("/dashboard")} variant="secondary">بازگشت</Button>
          <Button onClick={logout} variant="dark">خروج</Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <Card>
          <PageHeader title="فرم ثبت داده HSE" />
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="metric-select" className="mb-1 block text-sm font-medium text-gray-700">معیار</label>
              <select
                id="metric-select"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">انتخاب کنید...</option>
                {METRICS.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
            {selectedMetric && (
              <Input
                label={`مقدار (${selectedMetric})`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`مقدار ${selectedMetric} را وارد کنید`}
                disabled={isSubmitting}
              />
            )}
            {formError && <p className="text-xs text-red-500" role="alert">{formError}</p>}
            <Button type="submit" loading={isSubmitting} disabled={!selectedMetric || !value.trim()} className="w-full sm:w-auto">
              {isSubmitting ? "در حال ثبت..." : "ثبت داده"}
            </Button>
          </form>
        </Card>

        <Card>
          <PageHeader title="سابقه داده‌های ثبت شده" />
          {isLoadingEntries && <LoadingSpinner size="md" />}
          {!isLoadingEntries && entriesError && (
            <p className="text-sm text-red-500">{entriesError}</p>
          )}
          {!isLoadingEntries && !entriesError && entries.length === 0 && (
            <EmptyState message="هنوز داده‌ای ثبت نکرده‌اید." />
          )}
          {!isLoadingEntries && !entriesError && entries.length > 0 && (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg border bg-white p-3">
                  {editingId === entry.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        disabled={isUpdating}
                        className="!mb-0 flex-1"
                      />
                      <Button variant="primary" loading={isUpdating} onClick={() => handleUpdate(entry.id)} className="!px-3 !py-2 !text-xs">
                        ذخیره
                      </Button>
                      <Button variant="secondary" onClick={cancelEditing} disabled={isUpdating} className="!px-3 !py-2 !text-xs">
                        انصراف
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-dark">
                          {entry.metric}: {entry.value}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(entry.created_at)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => startEditing(entry)} className="!px-2 !py-1 !text-xs">ویرایش</Button>
                        <Button variant="danger" onClick={() => setDeleteTarget(entry)} className="!px-2 !py-1 !text-xs">حذف</Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="تایید حذف">
        <p className="mb-2 text-sm text-gray-600">آیا از حذف این داده اطمینان دارید؟</p>
        {deleteTarget && (
          <p className="mb-4 rounded-md bg-gray-50 p-2 text-center text-sm font-semibold text-dark">
            {deleteTarget.metric}: {deleteTarget.value}
          </p>
        )}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="flex-1">انصراف</Button>
          <Button variant="danger" onClick={handleDeleteConfirm} loading={isDeleting} className="flex-1">
            {isDeleting ? "در حال حذف..." : "حذف"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
