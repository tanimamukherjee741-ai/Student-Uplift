import { db } from "@workspace/db";
import { tutorListingsTable, internshipListingsTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

async function seedListings() {
  console.log("Seeding sample tutor and internship listings...");

  // Check if already seeded
  const existingTutors = await db.select().from(tutorListingsTable).limit(1);
  const existingInternships = await db.select().from(internshipListingsTable).limit(1);

  if (existingTutors.length > 0 && existingInternships.length > 0) {
    console.log("Listings already seeded. Skipping.");
    return;
  }

  // Create a sample teacher account if not exists
  let teacherId = 1;
  let employerId = 1;

  const [teacher] = await db.select().from(usersTable).where(eq(usersTable.email, "teacher@eduearn.in")).limit(1);
  if (!teacher) {
    const bcrypt = (await import("bcryptjs")).default;
    const hash = await bcrypt.hash("password123", 10);
    const [newTeacher] = await db.insert(usersTable).values({
      name: "Priya Sharma", email: "teacher@eduearn.in", passwordHash: hash, role: "teacher",
    }).returning();
    teacherId = newTeacher.id;
  } else {
    teacherId = teacher.id;
  }

  const [employer] = await db.select().from(usersTable).where(eq(usersTable.email, "employer@eduearn.in")).limit(1);
  if (!employer) {
    const bcrypt = (await import("bcryptjs")).default;
    const hash = await bcrypt.hash("password123", 10);
    const [newEmployer] = await db.insert(usersTable).values({
      name: "TechStart India", email: "employer@eduearn.in", passwordHash: hash, role: "employer",
    }).returning();
    employerId = newEmployer.id;
  } else {
    employerId = employer.id;
  }

  if (existingTutors.length === 0) {
    await db.insert(tutorListingsTable).values([
      { teacherId, subject: "Mathematics", description: "Expert Maths tuition for Class 10-12 and JEE/NEET prep. 8 years of experience. Focus on concepts and problem solving.", fees: 2500, feesLabel: "per month", city: "Delhi", contactEmail: "teacher@eduearn.in", contactPhone: "9876543210", mode: "both" },
      { teacherId, subject: "Physics", description: "Physics made simple! Specializing in Class 11-12 and JEE preparation with interactive teaching methods.", fees: 3000, feesLabel: "per month", city: "Mumbai", contactEmail: "physics.tutor@example.com", contactPhone: "9988776655", mode: "online" },
      { teacherId, subject: "Chemistry", description: "Organic and Inorganic Chemistry for NEET and Class 12. Board exam focused teaching with past paper practice.", fees: 2000, feesLabel: "per month", city: "Bangalore", contactEmail: "chem.tutor@example.com", mode: "offline" },
      { teacherId, subject: "English", description: "Communication skills, grammar, and literature for Classes 6-12. Improve spoken and written English.", fees: 1500, feesLabel: "per month", city: "Pune", contactEmail: "english.tutor@example.com", mode: "online" },
      { teacherId, subject: "Accountancy", description: "Commerce Accountancy for Class 11-12 and CA Foundation. Learn from a Chartered Accountant with 10+ years experience.", fees: 3500, feesLabel: "per month", city: "Delhi", contactEmail: "ca.tutor@example.com", contactPhone: "9871234567", mode: "both" },
      { teacherId, subject: "Computer Science", description: "Programming fundamentals, Python, and CBSE CS curriculum. Perfect for beginners and exam prep.", fees: 2800, feesLabel: "per month", city: "Hyderabad", contactEmail: "cs.tutor@example.com", mode: "online" },
    ]);
    console.log("Seeded 6 tutor listings");
  }

  if (existingInternships.length === 0) {
    await db.insert(internshipListingsTable).values([
      { employerId, title: "Frontend Developer Intern", description: "Join our startup to build modern web interfaces. You will work with React, TypeScript, and Tailwind CSS. Great learning opportunity with mentorship.", type: "internship", payment: 8000, paymentLabel: "per month", location: "Remote", applyEmail: "careers@techstartindia.com", skills: "React, HTML, CSS, JavaScript" },
      { employerId, title: "Content Writer (Part-time)", description: "Write engaging blog posts and social media content for our EdTech platform. Flexible hours, work from home.", type: "part_time", payment: 5000, paymentLabel: "per month", location: "Remote", applyEmail: "content@eduearn.in", skills: "Writing, Research, SEO basics" },
      { employerId, title: "Data Entry Freelancer", description: "Flexible data entry and spreadsheet management work. Perfect for students who want to earn while studying.", type: "freelance", payment: 200, paymentLabel: "per task", location: "Remote", applyEmail: "freelance@dataworks.in", skills: "MS Excel, Typing, Attention to detail" },
      { employerId, title: "Graphic Design Intern", description: "Create social media graphics, posters, and marketing materials for our D2C brand. Portfolio opportunity!", type: "internship", payment: 6000, paymentLabel: "per month", location: "Bangalore", applyLink: "https://forms.google.com/apply-design", skills: "Canva, Photoshop, Figma" },
      { employerId, title: "Social Media Manager (Part-time)", description: "Manage Instagram, YouTube, and Twitter accounts for a growing fitness brand. 3-4 hours per day.", type: "part_time", payment: 7000, paymentLabel: "per month", location: "Remote", applyEmail: "social@fitnessbrand.in", skills: "Social media, Content creation, Analytics" },
      { employerId, title: "Python Tutoring Freelancer", description: "Tutor school and college students on Python programming. Set your own hours and rates beyond the base pay.", type: "freelance", payment: 500, paymentLabel: "per session", location: "Remote", applyEmail: "tutors@codingschool.in", skills: "Python, Teaching, Patience" },
    ]);
    console.log("Seeded 6 internship listings");
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seedListings().catch(console.error);
