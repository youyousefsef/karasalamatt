import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import VerifyOtpClient from "./VerifyOtpClient";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <VerifyOtpClient />
    </Suspense>
  );
}
