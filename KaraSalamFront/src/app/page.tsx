"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorMessage } from "@/components/ErrorMessage";
import type { GenerateOTPResponse } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (value: string): boolean => {
    return /^09\d{9}$/.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validatePhone(phone)) {
      setError("شماره موبایل باید با 09 شروع شود و 11 رقم باشد");
      return;
    }

    setIsLoading(true);
    try {
      await api.post<GenerateOTPResponse>("/auth/generate-otp", {
        phone_number: phone,
      });
      sessionStorage.setItem("otp_phone", phone);
      router.push("/verify-otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارسال کد");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-dark">
          کارا سلامت
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          برای ورود شماره موبایل خود را وارد کنید
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="شماره موبایل"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09123456789"
            disabled={isLoading}
            error={error}
            inputMode="numeric"
          />

          <Button type="submit" loading={isLoading} className="w-full">
            {isLoading ? "در حال ارسال..." : "ارسال کد"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
