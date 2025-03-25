import { Check, X } from "lucide-react";

export default function ResolutionSelectWidget(
  { resolution, setResolution }: {
    resolution: boolean | undefined;
    setResolution: (value: boolean | undefined) => void;
  },
) {
  const buttonClasses = (selected: boolean) =>
    `px-4 py-1.5 rounded-full transition-colors duration-200 hover:bg-background ${
      selected ? "bg-background" : ""
    }`;
  return (
    <div className="inline-flex justify-between items-center bg-secondary rounded-full p-1 w-fit">
      <button
        className={buttonClasses(resolution === false)}
        onClick={() => setResolution(false)}
      >
        <X
          size={20}
          strokeWidth={3}
          className={`hover:text-destructive ${
            resolution === false ? "text-destructive" : "text-muted-foreground"
          }`}
        />
      </button>

      <button
        className={buttonClasses(resolution === true)}
        onClick={() => setResolution(true)}
      >
        <Check
          size={20}
          strokeWidth={3}
          className={`hover:text-green-500 ${
            resolution === true ? "text-green-500" : "text-muted-foreground"
          }`}
        />
      </button>
    </div>
  );
}
