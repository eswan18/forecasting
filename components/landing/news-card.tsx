import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface NewsCardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  buttons?: React.ReactNode;
}

export default function NewsCard({
  icon: Icon,
  title,
  children,
  buttons,
}: NewsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-0 grid-rows-[auto]">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {children}
      </CardContent>
      {buttons && (
        <CardFooter className="flex gap-2 flex-wrap justify-center">
          {buttons}
        </CardFooter>
      )}
    </Card>
  );
}
