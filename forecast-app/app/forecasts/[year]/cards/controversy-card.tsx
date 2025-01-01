import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ControversyCard() {
  return (
    <Card className="w-72 h-96">
      <CardHeader>
        <CardTitle>Controversial Props</CardTitle>
        <CardDescription>
          Props with the most disagreement among forecasters.
        </CardDescription>
      </CardHeader>
      <CardContent>
      </CardContent>
    </Card>
  );
}
