import { OnboardingGate } from "@/components/OnboardingGate";
import { CustomerChrome } from "@/components/layout/CustomerChrome";
import { ToastProvider } from "@bazmly/ui/Toast";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGate>
      <ToastProvider>
        <CustomerChrome>{children}</CustomerChrome>
      </ToastProvider>
    </OnboardingGate>
  );
}
