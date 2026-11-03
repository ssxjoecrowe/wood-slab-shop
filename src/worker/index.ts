import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { z } from 'zod';
import Stripe from 'stripe';
import { Resend } from 'resend';

type Bindings = {
  INQUIRIES_KV: KVNamespace;
  ADMIN_PASSWORD: string;
  STRIPE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  TO_EMAIL: string;
  SITE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: ['http://localhost:4321', 'https://wood-slab-shop.pages.dev'],
  credentials: true,
}));

const inquirySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  slab: z.string().max(200).optional(),
  message: z.string().min(10).max(5000),
  consent: z.literal('on'),
});

const paymentLinkSchema = z.object({
  slab: z.string().min(1).max(200),
  amount: z.number().int().positive().max(100000),
  description: z.string().max(500).optional(),
});

const slabStatusSchema = z.object({
  slug: z.string().min(1).max(100),
  status: z.enum(['available', 'pending', 'sold']),
});

function verifyAdmin(c: any) {
  const session = getCookie(c, 'admin_session');
  return session === 'authenticated';
}

app.post('/api/inquire', async (c) => {
  try {
    const body = await c.req.json();
    const data = inquirySchema.parse(body);

    const inquiry = {
      ...data,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    };

    const key = `inquiry:${inquiry.timestamp}:${inquiry.id}`;
    await c.env.INQUIRIES_KV.put(key, JSON.stringify(inquiry));

    if (c.env.RESEND_API_KEY && c.env.FROM_EMAIL && c.env.TO_EMAIL) {
      try {
        const resend = new Resend(c.env.RESEND_API_KEY);
        await resend.emails.send({
          from: c.env.FROM_EMAIL,
          to: c.env.TO_EMAIL,
          subject: `New Inquiry: ${data.name} - ${data.slab || 'General'}`,
          html: `
            <h2>New Inquiry</h2>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
            ${data.slab ? `<p><strong>Slab:</strong> ${data.slab}</p>` : ''}
            <p><strong>Message:</strong></p>
            <p>${data.message.replace(/\n/g, '<br>')}</p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }

    return c.json({ success: true, message: 'Inquiry submitted successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid form data', details: error.errors }, 400);
    }
    console.error('Inquiry error:', error);
    return c.json({ error: 'Failed to submit inquiry' }, 500);
  }
});

app.post('/api/admin/auth', async (c) => {
  try {
    const { password } = await c.req.json();
    if (password === c.env.ADMIN_PASSWORD) {
      setCookie(c, 'admin_session', 'authenticated', {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        maxAge: 60 * 60 * 8,
        path: '/',
      });
      return c.json({ success: true });
    }
    return c.json({ error: 'Invalid password' }, 401);
  } catch {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

app.post('/api/admin/logout', async (c) => {
  deleteCookie(c, 'admin_session', { path: '/' });
  return c.json({ success: true });
});

app.get('/api/admin/slabs', async (c) => {
  if (!verifyAdmin(c)) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const response = await fetch(`${c.env.SITE_URL}/api/slabs.json`);
    if (!response.ok) throw new Error('Failed to fetch slabs');
    const slabs = await response.json();
    return c.json(slabs.map((s: any) => ({
      slug: s.slug,
      title: s.title,
      price: s.price,
      status: s.status,
    })));
  } catch {
    return c.json([]);
  }
});

app.post('/api/admin/payment-link', async (c) => {
  if (!verifyAdmin(c)) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const body = await c.req.json();
    const data = paymentLinkSchema.parse(body);

    if (!c.env.STRIPE_SECRET_KEY) {
      return c.json({ error: 'Stripe not configured' }, 500);
    }

    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: data.slab,
              description: data.description || `Payment for ${data.slab}`,
            },
            unit_amount: data.amount * 100,
          },
          quantity: 1,
        },
      ],
      after_completion: { type: 'redirect', redirect: { url: `${c.env.SITE_URL}/thank-you` } },
      metadata: { slab: data.slab },
    });

    return c.json({ url: paymentLink.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid data', details: error.errors }, 400);
    }
    console.error('Payment link error:', error);
    return c.json({ error: 'Failed to create payment link' }, 500);
  }
});

app.get('/api/admin/inquiries', async (c) => {
  if (!verifyAdmin(c)) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const list = await c.env.INQUIRIES_KV.list({ prefix: 'inquiry:' });
    const inquiries = await Promise.all(
      list.keys.map(async (key) => {
        const value = await c.env.INQUIRIES_KV.get(key.name);
        return value ? JSON.parse(value) : null;
      })
    );
    return c.json(inquiries.filter(Boolean).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  } catch {
    return c.json([]);
  }
});

app.post('/api/admin/slab-status', async (c) => {
  if (!verifyAdmin(c)) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const body = await c.req.json();
    const data = slabStatusSchema.parse(body);

    return c.json({
      success: true,
      message: `Status updated to ${data.status} for ${data.slug}. Note: This requires Git integration to persist to content files.`,
      slug: data.slug,
      status: data.status,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid data', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to update status' }, 500);
  }
});

app.get('/api/slabs.json', async (c) => {
  const slabs = await c.env.INQUIRIES_KV.get('slabs:cache');
  if (slabs) {
    return c.json(JSON.parse(slabs));
  }
  return c.json([]);
});

export default app;