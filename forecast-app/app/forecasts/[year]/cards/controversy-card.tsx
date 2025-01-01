import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ControversyCard() {
  return (
    <Card className="w-72 h-96">
      <CardHeader>
        <CardTitle>Controversy</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>
          This is a controversial forecast.
        </CardDescription>
      </CardContent>
      <CardFooter>
        <a href="/about">Learn more</a>
      </CardFooter>
    </Card>
  );
}
