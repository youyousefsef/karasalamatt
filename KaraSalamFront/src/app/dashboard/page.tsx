"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getRole, logout } from "@/lib/auth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }
    setRole(getRole());
  }, [router]);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between bg-white px-4 py-4 shadow-sm sm:px-6">
        <h1 className="text-xl font-bold text-dark">کارا سلامت</h1>
        <Button onClick={logout} variant="dark">
          خروج
        </Button>
      </header>

      <main className="mx-auto max-w-4xl p-4 sm:p-6">
        <Card>
          {role === "admin" && (
            <div>
              <PageHeader title="پنل مدیریت" />
              <p className="mb-4 text-gray-600">
                به پنل مدیریت خوش آمدید.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => router.push("/admin/supervisors")}>
                  مدیریت ناظران HSE
                </Button>
                <Button
                  onClick={() => router.push("/admin/hse-data")}
                  variant="secondary"
                >
                  مشاهده داده‌های HSE
                </Button>
              </div>
            </div>
          )}

          {(role === "HSESupervisor" || role === "user") && (
            <div>
              <PageHeader title="داشبورد" />
              {role === "HSESupervisor" ? (
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => router.push("/dashboard/hse-data")}>
                    ثبت داده HSE
                  </Button>
                </div>
              ) : (
                <p className="text-gray-600">
                  پنل کاربری به زودی اضافه خواهد شد.
                </p>
              )}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
