interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex justify-center py-12 ${className}`}
      role="status"
      aria-label="در حال بارگذاری"
    >
      <div
        className={`animate-spin rounded-full border-accent border-t-transparent ${sizeClasses[size]}`}
      />
    </div>
  );
}
