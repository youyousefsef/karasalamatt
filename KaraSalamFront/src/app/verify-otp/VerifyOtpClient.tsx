"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";
import { showToast } from "@/components/Toast";
import type { CreateUserResponse, GenerateOTPResponse } from "@/types";

const RESEND_COOLDOWN = 110;

export default function VerifyOtpClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryPhone = searchParams.get("phone") || "";
  const storedPhone =
    typeof window !== "undefined"
      ? sessionStorage.getItem("otp_phone")
      : null;
  const phone = storedPhone || queryPhone;

  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [fullname, setFullname] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (phone && !storedPhone && queryPhone) {
      sessionStorage.setItem("otp_phone", phone);
    }
  }, [phone, storedPhone, queryPhone]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleResend = useCallback(async () => {
    if (resendCountdown > 0 || !phone) return;
    setError("");
    try {
      await api.post<GenerateOTPResponse>("/auth/generate-otp", {
        phone_number: phone,
      });
      setResendCountdown(RESEND_COOLDOWN);
      showToast("کد تایید مجددا ارسال شد", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در ارسال مجدد کد";
      if (msg.includes("429") || msg.includes("OTP already sent")) {
        setResendCountdown(RESEND_COOLDOWN);
      }
      setError(msg);
    }
  }, [phone, resendCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 4) {
      setError("کد تایید ۴ رقمی را وارد کنید");
      return;
    }
    if (!name.trim() || !fullname.trim()) {
      setError("نام و نام خانوادگی را وارد کنید");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post<CreateUserResponse>(
        "/auth/verify-otp-and-create-user",
        {
          phone_number: phone,
          otp_code: otp,
          name: name.trim(),
          fullname: fullname.trim(),
        }
      );

      saveAuth({
        access_token: res.access_token,
        role: res.role,
        phone_number: res.phone_number,
      });

      sessionStorage.removeItem("otp_phone");
      showToast("ورود موفقیت‌آمیز", "success");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در تایید کد");
    } finally {
      setIsLoading(false);
    }
  };

  if (!phone) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="text-center">
          <p className="text-gray-500 mb-4">شماره تلفن وارد نشده است.</p>
          <Button onClick={() => router.push("/")} variant="primary">
            بازگشت به صفحه ورود
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-dark">
          تایید شماره
        </h1>
        <p className="mb-1 text-center text-sm text-gray-500">
          کد تایید به شماره زیر ارسال شد
        </p>
        <p className="mb-6 text-center font-semibold text-accent" dir="ltr">
          {phone}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="کد تایید"
            type="text"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="1234"
            disabled={isLoading}
            maxLength={4}
            inputMode="numeric"
            className="text-center text-lg tracking-[0.5em]"
          />

          <Input
            label="نام"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="علی"
            disabled={isLoading}
          />

          <Input
            label="نام خانوادگی"
            type="text"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            placeholder="محمدی"
            disabled={isLoading}
          />

          {error && (
            <div className="text-sm text-red-500" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" loading={isLoading} className="w-full">
            {isLoading ? "در حال تایید..." : "تایید و ورود"}
          </Button>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                sessionStorage.removeItem("otp_phone");
                router.push("/");
              }}
            >
              اصلاح شماره موبایل
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleResend}
              disabled={resendCountdown > 0}
            >
              {resendCountdown > 0
                ? `ارسال مجدد (${resendCountdown})`
                : "ارسال مجدد کد"}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
