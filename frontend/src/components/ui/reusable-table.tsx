import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Align = "left" | "right" | "center";

export type Column<T> = {
  key: string;
  title: string;
  align?: Align;
  width?: string; // e.g. '150px' or '20%'
  render?: (row: T, index: number) => React.ReactNode;
};

export interface ReusableTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: (row: T, index: number) => string;
  height?: number; // optional explicit height in px
  width?: number; // optional explicit width in px
  className?: string;
  emptyMessage?: string;
}

export function ReusableTable<T>({
  columns,
  data,
  rowKey,
  height,
  width,
  className,
  emptyMessage = "No rows found",
}: ReusableTableProps<T>): JSX.Element {
  const [tableHeight, setTableHeight] = useState<number>(() => {
    if (typeof height === "number") return height;
    // default to half the window height, minimum 200px
    if (typeof window !== "undefined") return Math.max(200, Math.floor(window.innerHeight * 0.5));
    return 400;
  });

  useEffect(() => {
    if (typeof height === "number") return;
    const onResize = () => setTableHeight(Math.max(200, Math.floor(window.innerHeight * 0.5)));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [height]);

  const headerCells = useMemo(
    () =>
      columns.map((c) => (
        <TableHead
          key={c.key}
          style={{ width: c.width ?? undefined }}
          className={
            `${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"} sticky top-0 bg-background/80 backdrop-blur-sm z-20 font-semibold`
          }
        >
          {c.title}
        </TableHead>
      )),
    [columns],
  );

  return (
    <div
      className={className}
      style={{ width: width ? `${width}px` : "100%", maxHeight: `${tableHeight}px`, overflow: "auto" }}
    >
      <Table disableWrapper>
        <TableHeader>
          <TableRow>{headerCells}</TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, idx) => (
              <TableRow key={rowKey ? rowKey(row, idx) : `${idx}`}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}>
                    {col.render ? col.render(row, idx) : (row as any)[col.key] ?? "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default ReusableTable;
