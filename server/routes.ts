import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { products, users, orders, orderItems } from "@db/schema";
import Stripe from "stripe";
import passport from "./auth";
import bcrypt from "crypto";
import { eq } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY must be set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
        })
        .returning();

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in" });
        }
        return res.json({ user: { id: user.id, username: user.username, email: user.email } });
      });
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    const user = req.user as any;
    res.json({ user: { id: user.id, username: user.username, email: user.email } });
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
    res.json({ user: { id: user.id, username: user.username, email: user.email } });
  });

  // Existing routes
  app.get("/api/products", async (_req, res) => {
    const allProducts = await db.select().from(products);
    res.json(allProducts);
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
      .where(products.id.in(productIds));

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