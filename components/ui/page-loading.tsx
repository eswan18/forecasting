import { Spinner } from "@/components/ui/spinner";

// Full screen loading for page transitions
export function PageLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="text-center">
        <Spinner className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
