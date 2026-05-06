import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, Plus, Edit, Trash2 } from "lucide-react";

const ITEM_TYPE_COLORS: Record<string, string> = {
  consumable: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  expendable: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  permanent: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  fixed_asset: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  consumable: "Consumable",
  expendable: "Expendable",
  permanent: "Permanent",
  fixed_asset: "Fixed Asset",
};

const inventoryData = [
  { id: 1, name: "Algebra Textbook", category: "Books", category_type: "expendable", quantity: 145, location: "Room 201", status: "Available", lastUpdated: "2024-01-15" },
  { id: 2, name: "Dell Laptop", category: "Technology", category_type: "fixed_asset", quantity: 23, location: "Tech Lab", status: "Available", lastUpdated: "2024-01-14" },
  { id: 3, name: "Scientific Calculator", category: "Technology", category_type: "permanent", quantity: 5, location: "Math Dept", status: "Low Stock", lastUpdated: "2024-01-13" },
  { id: 4, name: "Chemistry Lab Kit", category: "Equipment", category_type: "consumable", quantity: 32, location: "Lab 3", status: "Available", lastUpdated: "2024-01-12" },
  { id: 5, name: "Basketball", category: "Equipment", category_type: "consumable", quantity: 18, location: "Gym Storage", status: "Available", lastUpdated: "2024-01-11" },
  { id: 6, name: "Office Chair", category: "Furniture", category_type: "fixed_asset", quantity: 67, location: "Storage A", status: "Available", lastUpdated: "2024-01-10" },
  { id: 7, name: "Biology Textbook", category: "Books", category_type: "expendable", quantity: 8, location: "Room 305", status: "Low Stock", lastUpdated: "2024-01-09" },
  { id: 8, name: "iPad Pro", category: "Technology", category_type: "fixed_asset", quantity: 15, location: "Tech Lab", status: "Available", lastUpdated: "2024-01-08" },
  { id: 9, name: "Lab Goggles", category: "Equipment", category_type: "permanent", quantity: 3, location: "Lab 1", status: "Critical", lastUpdated: "2024-01-07" },
  { id: 10, name: "Student Desk", category: "Furniture", category_type: "fixed_asset", quantity: 89, location: "Storage B", status: "Available", lastUpdated: "2024-01-06" },
];

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Critical":
        return <Badge variant="destructive">{status}</Badge>;
      case "Low Stock":
        return <Badge className="bg-warning text-white">{status}</Badge>;
      default:
        return <Badge className="bg-success text-white">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all inventory items
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Item
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="books">Books</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="furniture">Furniture</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Item Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge className={ITEM_TYPE_COLORS[item.category_type] || "bg-gray-100"}>
                    {ITEM_TYPE_LABELS[item.category_type] || item.category_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.category}</Badge>
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="text-muted-foreground">{item.location}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell className="text-muted-foreground">{item.lastUpdated}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
