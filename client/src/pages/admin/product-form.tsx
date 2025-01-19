import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SelectProduct } from "@db/schema";

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  description: z.string().min(1, "Description is required"),
  price: z.string()
    .min(1, "Price is required")
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0;
    }, "Price must be a valid positive number"),
  image: z.string().url("Must be a valid URL"),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductForm() {
  const [, setLocation] = useLocation();
  const [isMatch, params] = useRoute("/admin/products/:id");
  const isEditMode = isMatch && params?.id && params.id !== 'new';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading: isLoadingProduct } = useQuery<SelectProduct>({
    queryKey: [`/api/products/${params?.id}`],
    enabled: !!isEditMode && !!params?.id,
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "0.00",
      image: "",
    },
    values: product ? {
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
    } : undefined,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const price = Number(data.price);
      if (isNaN(price) || price <= 0) {
        throw new Error("Invalid price value");
      }

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          price: price.toFixed(2),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create product");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      setLocation("/admin/dashboard");
    },
    onError: (error) => {
      console.error("Creation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!params?.id) throw new Error("No product ID provided");

      const price = Number(data.price);
      if (isNaN(price) || price <= 0) {
        throw new Error("Invalid price value");
      }

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          price: price.toFixed(2),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update product");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setLocation("/admin/dashboard");
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
      });
    },
  });

  async function onSubmit(data: ProductFormData) {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  }

  if (isEditMode && isLoadingProduct) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded" />
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
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => setLocation("/admin/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-8">
          {isEditMode ? "Edit Product" : "Add New Product"}
        </h1>

        <div className="max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Product name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Product description"
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        inputMode="decimal"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com/image.jpg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditMode ? "Update Product" : "Create Product"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}