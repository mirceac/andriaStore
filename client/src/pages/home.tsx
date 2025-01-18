import { ProductGrid } from "@/components/product-grid";
import { CartDrawer } from "@/components/cart-drawer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Modern Shop</h1>
          <CartDrawer />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <ProductGrid />
      </main>
    </div>
  );
}
