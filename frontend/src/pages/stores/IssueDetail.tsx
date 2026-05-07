import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory.service";
import { Button } from "@/components/ui/button";

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: s13, isLoading } = useQuery(["s13", id], () => inventoryService.getS13Record(id || ""), {
    enabled: !!id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (!s13) return <div>S13 record not found.</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{s13.id}</h2>
        <div className="flex gap-2">
          <Button onClick={() => window.print()}>Print</Button>
          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div><strong>Date:</strong> {s13.date || s13.createdAt}</div>
        <div><strong>Department:</strong> {s13.department}</div>
        <div><strong>Requested By:</strong> {s13.requestedBy}</div>
        <div><strong>Items:</strong> {s13.items}</div>
        <div><strong>Status:</strong> {s13.status}</div>
      </div>
      {/* If backend exposes line items / ledger entries, add here later */}
    </div>
  );
}
