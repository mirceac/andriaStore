import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import type { SelectProduct } from "@db/schema";

interface ProductCardProps {
  product: SelectProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full aspect-square object-cover hover:scale-105 transition-transform"
        />
        <div className="p-4">
          <h3 className="font-semibold text-lg">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{product.description}</p>
          <p className="text-lg font-bold mt-2">${Number(product.price).toFixed(2)}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => addToCart(product)}
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
