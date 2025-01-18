import { ProductGrid } from "@/components/product-grid";
import { CartDrawer } from "@/components/cart-drawer";
import { AuthDialog } from "@/components/auth-dialog";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Modern Shop</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                {user.isAdmin && (
                  <Link href="/admin/dashboard">
                    <Button variant="ghost">Admin</Button>
                  </Link>
                )}
                <Button variant="outline" onClick={logout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <AuthDialog />
            )}
            <CartDrawer />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <ProductGrid />
      </main>
    </div>
  );
}