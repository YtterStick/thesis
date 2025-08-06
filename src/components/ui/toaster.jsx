import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant = "default", ...props }) => (
        <Toast
          key={id}
          variant={variant}
          duration={4000}
          {...props}
        >
          <div className="grid gap-1">
            {title && (
              <ToastTitle
                className={variant === "destructive" ? "text-red-100" : ""}
              >
                {title}
              </ToastTitle>
            )}
            {description && (
              <ToastDescription
                className={variant === "destructive" ? "text-red-200" : ""}
              >
                {description}
              </ToastDescription>
            )}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}