import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tutorListingsTable, usersTable } from "@workspace/db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
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

router.get("/tutors", async (req, res) => {
  const { city, subject } = req.query as { city?: string; subject?: string };

  const conditions: any[] = [];
  if (city) conditions.push(ilike(tutorListingsTable.city, `%${city}%`));
  if (subject) conditions.push(ilike(tutorListingsTable.subject, `%${subject}%`));

  const listings = conditions.length > 0
    ? await db.select().from(tutorListingsTable).where(and(...conditions)).orderBy(tutorListingsTable.createdAt)
    : await db.select().from(tutorListingsTable).orderBy(tutorListingsTable.createdAt);

  const teacherIds = [...new Set(listings.map((l) => l.teacherId))];
  const teachers = teacherIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(sql`${usersTable.id} = ANY(${teacherIds})`)
    : [];

  const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));

  res.json(
    listings.map((l) => ({
      id: l.id,
      teacherId: l.teacherId,
      teacherName: teacherMap.get(l.teacherId) ?? "Unknown",
      subject: l.subject,
      description: l.description,
      fees: l.fees,
      feesLabel: l.feesLabel,
      city: l.city,
      contactEmail: l.contactEmail,
      contactPhone: l.contactPhone,
      mode: l.mode,
      createdAt: l.createdAt,
    }))
  );
});

router.get("/tutors/my-listings", requireAuth, requireRole(["teacher"]), async (req, res) => {
  const userId = (req.session as any).userId;
  const listings = await db.select().from(tutorListingsTable).where(eq(tutorListingsTable.teacherId, userId)).orderBy(tutorListingsTable.createdAt);
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  res.json(listings.map((l) => ({
    id: l.id, teacherId: l.teacherId, teacherName: user?.name ?? "Unknown",
    subject: l.subject, description: l.description, fees: l.fees, feesLabel: l.feesLabel,
    city: l.city, contactEmail: l.contactEmail, contactPhone: l.contactPhone, mode: l.mode, createdAt: l.createdAt,
  })));
});

router.post("/tutors", requireAuth, requireRole(["teacher"]), async (req, res) => {
  const userId = (req.session as any).userId;
  const { subject, description, fees, feesLabel, city, contactEmail, contactPhone, mode } = req.body;

  if (!subject || !city || !contactEmail || !mode) {
    res.status(400).json({ error: "Subject, city, contact email, and mode are required" });
    return;
  }

  const [listing] = await db.insert(tutorListingsTable).values({
    teacherId: userId, subject, description, fees: fees ?? 0, feesLabel: feesLabel ?? "per month",
    city, contactEmail, contactPhone, mode,
  }).returning();

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  res.status(201).json({
    id: listing.id, teacherId: listing.teacherId, teacherName: user?.name ?? "Unknown",
    subject: listing.subject, description: listing.description, fees: listing.fees,
    feesLabel: listing.feesLabel, city: listing.city, contactEmail: listing.contactEmail,
    contactPhone: listing.contactPhone, mode: listing.mode, createdAt: listing.createdAt,
  });
});

router.delete("/tutors/:id", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [listing] = await db.select().from(tutorListingsTable).where(eq(tutorListingsTable.id, id)).limit(1);
  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
  if (listing.teacherId !== userId) { res.status(403).json({ error: "Not your listing" }); return; }

  await db.delete(tutorListingsTable).where(eq(tutorListingsTable.id, id));
  res.json({ success: true, message: "Listing deleted" });
});

export default router;
