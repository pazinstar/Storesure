import { useSchool } from "@/contexts/SchoolContext";

export const SchoolNameDisplay = () => {
  const { currentSchool } = useSchool();
  
  return (
    <h2 className="text-sm font-medium text-muted-foreground">
      {currentSchool?.name || "StoreSure"}
    </h2>
  );
};
