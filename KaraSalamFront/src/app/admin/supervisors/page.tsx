"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken, getRole, logout } from "@/lib/auth";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { showToast } from "@/components/Toast";
import type { HSEReg } from "@/types";

const PAGE_SIZE = 10;

export default function SupervisorsPage() {
  const router = useRouter();

  const [supervisors, setSupervisors] = useState<HSEReg[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isClient, setIsClient] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [addError, setAddError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<HSEReg | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSupervisors = useCallback(async (skip = 0) => {
    setIsLoading(true);
    setError("");
    try {
      const data = await api.get<HSEReg[]>(
        `/auth/get_all_supervisors?skip=${skip}&limit=${PAGE_SIZE}`
      );
      if (Array.isArray(data)) {
        setSupervisors(data);
        setHasMore(data.length >= PAGE_SIZE);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت لیست");
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
    fetchSupervisors(0);
  }, [router, fetchSupervisors]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");

    if (!/^09\d{9}$/.test(newPhone)) {
      setAddError("شماره موبایل معتبر وارد کنید");
      return;
    }

    setIsAdding(true);
    try {
      await api.post("/auth/add-supervisor", {
        phone_number: newPhone,
        role: "HSESupervisor",
      });
      setShowAddModal(false);
      setNewPhone("");
      setPage(0);
      await fetchSupervisors(0);
      showToast("ناظر با موفقیت افزوده شد", "success");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "خطا در افزودن");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/auth/delete_sup/${deleteTarget.id}`);
      setDeleteTarget(null);
      const newSkip = supervisors.length === 1 && page > 0 ? (page - 1) * PAGE_SIZE : page * PAGE_SIZE;
      setPage(Math.floor(newSkip / PAGE_SIZE));
      await fetchSupervisors(newSkip);
      showToast("ناظر با موفقیت حذف شد", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در حذف");
    } finally {
      setIsDeleting(false);
    }
  };

  const goToPage = (newPage: number) => {
    setPage(newPage);
    fetchSupervisors(newPage * PAGE_SIZE);
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between bg-white px-4 py-4 shadow-sm sm:px-6">
        <h1 className="text-xl font-bold text-dark">مدیریت ناظران</h1>
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
        <PageHeader
          title="لیست ناظران HSE"
          actions={
            <Button onClick={() => setShowAddModal(true)}>
              افزودن ناظر
            </Button>
          }
        />

        {isLoading && <LoadingSpinner size="lg" />}

        {error && !isLoading && (
          <ErrorMessage
            message={error}
            onRetry={() => fetchSupervisors(page * PAGE_SIZE)}
          />
        )}

        {!isLoading && !error && supervisors.length === 0 && (
          <EmptyState message="هیچ ناظری ثبت نشده است." />
        )}

        {!isLoading && supervisors.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-right">
                    <th className="px-4 py-3 font-medium">ردیف</th>
                    <th className="px-4 py-3 font-medium">شماره موبایل</th>
                    <th className="px-4 py-3 font-medium">نقش</th>
                    <th className="px-4 py-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {supervisors.map((sup, index) => (
                    <tr
                      key={sup.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        {page * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-3" dir="ltr">
                        {sup.phone_num}
                      </td>
                      <td className="px-4 py-3">{sup.role}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="danger"
                          onClick={() => setDeleteTarget(sup)}
                          className="!px-3 !py-1.5 !text-xs"
                        >
                          حذف
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card layout */}
            <div className="space-y-3 md:hidden">
              {supervisors.map((sup, index) => (
                <Card key={sup.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-dark" dir="ltr">
                      {sup.phone_num}
                    </p>
                    <p className="text-xs text-gray-500">{sup.role}</p>
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => setDeleteTarget(sup)}
                    className="!px-3 !py-1.5 !text-xs"
                    aria-label={`حذف ناظر ${sup.phone_num}`}
                  >
                    حذف
                  </Button>
                </Card>
              ))}
            </div>

            {/* Pagination */}
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

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setAddError("");
        }}
        title="افزودن ناظر جدید"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="شماره موبایل"
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="09123456789"
            disabled={isAdding}
            error={addError}
            inputMode="numeric"
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                setAddError("");
              }}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              loading={isAdding}
              className="flex-1"
            >
              {isAdding ? "در حال افزودن..." : "افزودن"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="تایید حذف"
      >
        <p className="mb-2 text-sm text-gray-600">
          آیا از حذف این ناظر اطمینان دارید؟
        </p>
        {deleteTarget && (
          <p className="mb-4 rounded-md bg-gray-50 p-2 text-center text-sm font-semibold text-dark" dir="ltr">
            {deleteTarget.phone_num}
          </p>
        )}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteTarget(null)}
            disabled={isDeleting}
            className="flex-1"
          >
            انصراف
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={isDeleting}
            className="flex-1"
          >
            {isDeleting ? "در حال حذف..." : "حذف"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
