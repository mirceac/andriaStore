import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import type { SelectOrder } from "@db/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: orders, isLoading } = useQuery<SelectOrder[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  if (!user) {
    setLocation("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Button>
          <h1 className="text-3xl font-bold">Order History</h1>
          <p className="text-gray-500">Welcome back, {user.username}!</p>
        </div>

        <div className="space-y-6">
          {orders?.length === 0 ? (
            <p className="text-gray-500">No orders found.</p>
          ) : (
            orders?.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-6 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order #{order.id}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      Total: ${Number(order.total).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      Status: {order.status}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}