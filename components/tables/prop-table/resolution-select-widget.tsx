import { Check, X } from "lucide-react";

export default function ResolutionSelectWidget(
  { resolution, setResolution }: {
    resolution: boolean | undefined;
    setResolution: (value: boolean | undefined) => void;
  },
) {
  const buttonClasses = (selected: boolean) =>
    `px-4 py-1.5 rounded-full transition-colors duration-200 hover:bg-accent hover:text-accent-foreground ${
      selected ? "bg-background" : "text-muted-foreground"
    }`;
  const handleTrueClick = () => {
    // If already true, unresolve the prop. Otherwise resolve it to true.
    resolution === true ? setResolution(undefined) : setResolution(true);
  };
  const handleFalseClick = () => {
    // If already false, unresolve the prop. Otherwise resolve it to false.
    resolution === false ? setResolution(undefined) : setResolution(false);
  };
  return (
    <div className="inline-flex justify-between items-center bg-secondary rounded-full p-1 w-fit">
      <button
        className={buttonClasses(resolution === false)}
        onClick={handleFalseClick}
      >
        <X
          size={20}
          strokeWidth={3}
          className={resolution === false ? "text-destructive" : ""}
        />
      </button>

      <button
        className={buttonClasses(resolution === true)}
        onClick={handleTrueClick}
      >
        <Check
          size={20}
          strokeWidth={3}
          className={resolution === true ? "text-green-500" : ""}
        />
      </button>
    </div>
  );
}
