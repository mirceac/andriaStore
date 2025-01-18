import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { products } from "@db/schema";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY must be set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export function registerRoutes(app: Express): Server {
  app.get("/api/products", async (_req, res) => {
    const allProducts = await db.select().from(products);
    res.json(allProducts);
  });

  app.post("/api/checkout", async (req, res) => {
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
    });

    res.json({ url: session.url });
  });

  const httpServer = createServer(app);
  return httpServer;
}
