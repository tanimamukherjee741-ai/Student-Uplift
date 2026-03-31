import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { internshipListingsTable, usersTable } from "@workspace/db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any).userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  next();
}

function requireRole(roles: string[]) {
  return async (req: any, res: any, next: any) => {
    const userId = (req.session as any).userId;
    if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: `Role required: ${roles.join(" or ")}` });
      return;
    }
    next();
  };
}

router.get("/internships", async (req, res) => {
  const { type, location } = req.query as { type?: string; location?: string };

  const conditions: any[] = [];
  if (type) conditions.push(eq(internshipListingsTable.type, type));
  if (location) conditions.push(ilike(internshipListingsTable.location, `%${location}%`));

  const listings = conditions.length > 0
    ? await db.select().from(internshipListingsTable).where(and(...conditions)).orderBy(internshipListingsTable.createdAt)
    : await db.select().from(internshipListingsTable).orderBy(internshipListingsTable.createdAt);

  const employerIds = [...new Set(listings.map((l) => l.employerId))];
  const employers = employerIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(sql`${usersTable.id} = ANY(${employerIds})`)
    : [];

  const employerMap = new Map(employers.map((e) => [e.id, e.name]));

  res.json(listings.map((l) => ({
    id: l.id, employerId: l.employerId, employerName: employerMap.get(l.employerId) ?? "Unknown",
    title: l.title, description: l.description, type: l.type, payment: l.payment,
    paymentLabel: l.paymentLabel, location: l.location, applyLink: l.applyLink,
    applyEmail: l.applyEmail, skills: l.skills, createdAt: l.createdAt,
  })));
});

router.get("/internships/my-listings", requireAuth, requireRole(["employer"]), async (req, res) => {
  const userId = (req.session as any).userId;
  const listings = await db.select().from(internshipListingsTable).where(eq(internshipListingsTable.employerId, userId)).orderBy(internshipListingsTable.createdAt);
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  res.json(listings.map((l) => ({
    id: l.id, employerId: l.employerId, employerName: user?.name ?? "Unknown",
    title: l.title, description: l.description, type: l.type, payment: l.payment,
    paymentLabel: l.paymentLabel, location: l.location, applyLink: l.applyLink,
    applyEmail: l.applyEmail, skills: l.skills, createdAt: l.createdAt,
  })));
});

router.post("/internships", requireAuth, requireRole(["employer"]), async (req, res) => {
  const userId = (req.session as any).userId;
  const { title, description, type, payment, paymentLabel, location, applyLink, applyEmail, skills } = req.body;

  if (!title || !description || !location) {
    res.status(400).json({ error: "Title, description, and location are required" });
    return;
  }

  const [listing] = await db.insert(internshipListingsTable).values({
    employerId: userId, title, description, type: type ?? "internship",
    payment: payment ?? 0, paymentLabel: paymentLabel ?? "per month",
    location, applyLink, applyEmail, skills,
  }).returning();

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  res.status(201).json({
    id: listing.id, employerId: listing.employerId, employerName: user?.name ?? "Unknown",
    title: listing.title, description: listing.description, type: listing.type,
    payment: listing.payment, paymentLabel: listing.paymentLabel, location: listing.location,
    applyLink: listing.applyLink, applyEmail: listing.applyEmail, skills: listing.skills, createdAt: listing.createdAt,
  });
});

router.delete("/internships/:id", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [listing] = await db.select().from(internshipListingsTable).where(eq(internshipListingsTable.id, id)).limit(1);
  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
  if (listing.employerId !== userId) { res.status(403).json({ error: "Not your listing" }); return; }

  await db.delete(internshipListingsTable).where(eq(internshipListingsTable.id, id));
  res.json({ success: true, message: "Listing deleted" });
});

export default router;
