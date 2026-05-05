import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, canAccessLink, user } = useAuth();
  const location = useLocation();

  const hasAccess = isAuthenticated && canAccessLink(location.pathname);

  useEffect(() => {
    if (isAuthenticated && !hasAccess) {
      toast.error("You don't have permission to access that page", {
        description: `Your role: ${user?.role?.replace("_", " ")}`,
      });
    }
  }, [isAuthenticated, hasAccess, user?.role]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
