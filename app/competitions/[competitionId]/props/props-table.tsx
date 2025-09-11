"use client";

import { VProp } from "@/types/db_types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PropsTableProps {
  props: VProp[];
}

export function PropsTable({ props }: PropsTableProps) {
  if (props.length === 0) {
    return (
      <div className="py-8">
        <p className="text-center text-muted-foreground">
          No propositions found for this competition.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Propositions ({props.length})</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Forecast on these propositions for the competition
        </p>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden @md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Proposition</TableHead>
                  <TableHead className="w-[20%]">Category</TableHead>
                  <TableHead className="w-[15%]">Status</TableHead>
                  <TableHead className="w-[15%]">Resolution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {props.map((prop) => (
                  <TableRow key={prop.prop_id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <p className="text-sm leading-relaxed">{prop.prop_text}</p>
                        {prop.prop_notes && (
                          <p className="text-xs text-muted-foreground">
                            {prop.prop_notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {prop.category_name ? (
                        <Badge variant="outline">{prop.category_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ResolutionStatus resolution={prop.resolution} />
                    </TableCell>
                    <TableCell>
                      {prop.resolution_notes && (
                        <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {prop.resolution_notes}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="@md:hidden space-y-4">
        {props.map((prop) => (
          <Card key={prop.prop_id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-relaxed">
                  {prop.prop_text}
                </CardTitle>
                <ResolutionStatus resolution={prop.resolution} />
              </div>
              {prop.prop_notes && (
                <p className="text-sm text-muted-foreground">
                  {prop.prop_notes}
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {prop.category_name && (
                  <Badge variant="outline" className="text-xs">
                    {prop.category_name}
                  </Badge>
                )}
                {prop.resolution_notes && (
                  <div className="w-full mt-2">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Resolution notes:</span>{" "}
                      {prop.resolution_notes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ResolutionStatus({ resolution }: { resolution: boolean | null }) {
  if (resolution === null) {
    return (
      <Badge variant="secondary" className="text-xs">
        Unresolved
      </Badge>
    );
  }

  return (
    <Badge
      variant={resolution ? "default" : "destructive"}
      className="text-xs"
    >
      {resolution ? "True" : "False"}
    </Badge>
  );
}
