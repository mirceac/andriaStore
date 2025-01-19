import { z } from "zod";
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { products, users, orders, orderItems } from "@db/schema";
import Stripe from "stripe";
import passport from "./auth";
import bcrypt from "crypto";
import { eq, inArray } from "drizzle-orm";
import { adminMiddleware } from "./middleware/admin";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY must be set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Product validation schema
const createProductSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    description: z.string().min(1, "Description is required"),
    price: z.preprocess(
      (val) => (typeof val === 'string' ? val : String(val)),
      z.string().refine(
        (val) => {
          const num = Number(val);
          return !isNaN(num) && num > 0;
        },
        { message: "Price must be a valid positive number" }
      )
    ),
    image: z.string().url("Image must be a valid URL"),
  });

export function registerRoutes(app: Express): Server {
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    const { username, password, email } = req.body;

    try {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.pbkdf2Sync(password, username, 1000, 64, 'sha512').toString('hex');

      // Create user
      const [user] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          email,
          isAdmin: false, // New users are not admins by default
        })
        .returning();

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in" });
        }
        return res.json({ user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin } });
      });
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    const user = req.user as any;
    res.json({ user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin } });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = req.user as any;
    res.json({ user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin } });
  });

  // Admin routes
  app.post("/api/admin/products", adminMiddleware, async (req, res) => {
    try {
      const result = createProductSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "Invalid input",
          errors: result.error.errors,
        });
      }

      const productData = {
          name: result.data.name,
          description: result.data.description,
          price: result.data.price,
          image: result.data.image,
      };
      
      console.log("Attempting to insert product:", productData);
          const [product] = await db
            .insert(products)
            .values(productData)
            .returning();

      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Error creating product" });
    }
  });

  app.put("/api/admin/products/:id", adminMiddleware, async (req, res) => {
    try {
      const result = createProductSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "Invalid input",
          errors: result.error.errors,
        });
      }
      const [product] = await db
        .update(products)
        .set(result.data)
        .where(eq(products.id, parseInt(req.params.id)))
        .returning();
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error updating product" });
    }
  });

  app.delete("/api/admin/products/:id", adminMiddleware, async (req, res) => {
    try {
      await db.delete(products).where(eq(products.id, parseInt(req.params.id)));
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting product" });
    }
  });

  // Existing routes
  app.get("/api/products", async (_req, res) => {
    const allProducts = await db.select().from(products);
    res.json(allProducts);
  });

  app.get("/api/products/:id", async (req, res) => {
    const product = await db.query.products.findFirst({
      where: eq(products.id, parseInt(req.params.id)),
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  // Order history
  app.get("/api/orders", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      with: {
        items: {
          with: {
            product: true,
          },
        },
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    res.json(userOrders);
  });

  app.post("/api/checkout", async (req: Request, res) => {
    const { items } = req.body;

    const productIds = items.map((item: { id: number }) => item.id);
    const productsData = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const lineItems = items.map((item: { id: number; quantity: number }) => {
      const product = productsData.find(p => p.id === item.id);
      if (!product) throw new Error(`Product ${item.id} not found`);

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
            images: [product.image],
          },
          unit_amount: Math.round(Number(product.price) * 100),
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.REPLIT_DOMAINS?.split(',')[0]}/success`,
      cancel_url: `${process.env.REPLIT_DOMAINS?.split(',')[0]}/`,
      metadata: req.user ? { userId: (req.user as any).id } : undefined,
    });

    res.json({ url: session.url });
  });

  const httpServer = createServer(app);
  return httpServer;
}