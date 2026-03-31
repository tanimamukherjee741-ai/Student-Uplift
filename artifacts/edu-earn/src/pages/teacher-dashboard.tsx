import { useState } from "react";
import { 
  useGetMe, getGetMeQueryKey,
  useGetMyTutorListings, getGetMyTutorListingsQueryKey,
  useCreateTutorListing,
  useDeleteTutorListing,
  useGetMyInternshipListings, getGetMyInternshipListingsQueryKey,
  useCreateInternshipListing,
  useDeleteInternshipListing,
  CreateTutorListingRequestMode,
  CreateInternshipListingRequestType
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trash2, PlusCircle, BookOpen, Briefcase, MapPin, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const tutorSchema = z.object({
  subject: z.string().min(2, "Subject is required"),
  description: z.string().optional(),
  fees: z.coerce.number().min(0, "Fees must be a positive number"),
  feesLabel: z.string().min(1, "Label is required (e.g. per month)"),
  city: z.string().min(2, "City is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().optional(),
  mode: z.enum(["online", "offline", "both"]),
});

const internshipSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(10, "Description is required"),
  type: z.enum(["internship", "part_time", "freelance"]),
  payment: z.coerce.number().min(0, "Payment must be a positive number"),
  paymentLabel: z.string().min(1, "Label is required (e.g. per month)"),
  location: z.string().min(2, "Location is required"),
  applyLink: z.string().optional(),
  applyEmail: z.string().optional(),
  skills: z.string().optional(),
});

export default function TeacherDashboard() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading: isUserLoading } = useGetMe({ 
    query: { queryKey: getGetMeQueryKey() } 
  });

  const isTeacher = user?.role === 'teacher';
  const isEmployer = user?.role === 'employer';

  // Protect route
  if (!isUserLoading && !isTeacher && !isEmployer) {
    setLocation("/dashboard");
    return null;
  }

  // Tutors
  const { data: tutorListings, isLoading: isTutorsLoading } = useGetMyTutorListings({
    query: { queryKey: getGetMyTutorListingsQueryKey(), enabled: isTeacher }
  });
  const createTutor = useCreateTutorListing();
  const deleteTutor = useDeleteTutorListing();

  const tutorForm = useForm<z.infer<typeof tutorSchema>>({
    resolver: zodResolver(tutorSchema),
    defaultValues: {
      subject: "",
      description: "",
      fees: 0,
      feesLabel: "per month",
      city: "",
      contactEmail: user?.email || "",
      contactPhone: "",
      mode: "both",
    }
  });

  const onTutorSubmit = (data: z.infer<typeof tutorSchema>) => {
    createTutor.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Listing created!" });
        queryClient.invalidateQueries({ queryKey: getGetMyTutorListingsQueryKey() });
        tutorForm.reset();
      },
      onError: (err) => toast({ title: "Error", description: err.error, variant: "destructive" })
    });
  };

  const handleDeleteTutor = (id: number) => {
    deleteTutor.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Listing deleted" });
        queryClient.invalidateQueries({ queryKey: getGetMyTutorListingsQueryKey() });
      }
    });
  };

  // Internships
  const { data: internshipListings, isLoading: isInternshipsLoading } = useGetMyInternshipListings({
    query: { queryKey: getGetMyInternshipListingsQueryKey(), enabled: isEmployer }
  });
  const createInternship = useCreateInternshipListing();
  const deleteInternship = useDeleteInternshipListing();

  const internshipForm = useForm<z.infer<typeof internshipSchema>>({
    resolver: zodResolver(internshipSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "internship",
      payment: 0,
      paymentLabel: "per month",
      location: "",
      applyLink: "",
      applyEmail: user?.email || "",
      skills: "",
    }
  });

  const onInternshipSubmit = (data: z.infer<typeof internshipSchema>) => {
    createInternship.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Listing created!" });
        queryClient.invalidateQueries({ queryKey: getGetMyInternshipListingsQueryKey() });
        internshipForm.reset();
      },
      onError: (err) => toast({ title: "Error", description: err.error, variant: "destructive" })
    });
  };

  const handleDeleteInternship = (id: number) => {
    deleteInternship.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Listing deleted" });
        queryClient.invalidateQueries({ queryKey: getGetMyInternshipListingsQueryKey() });
      }
    });
  };

  if (isUserLoading) return <Layout><div className="p-8"><Skeleton className="h-64 w-full" /></div></Layout>;

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Provider Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your listings and reach more students.</p>
        </div>

        {isTeacher && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card className="bg-white border-border shadow-sm sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-primary" /> Post Tutor Listing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...tutorForm}>
                    <form onSubmit={tutorForm.handleSubmit(onTutorSubmit)} className="space-y-4">
                      <FormField control={tutorForm.control} name="subject" render={({ field }) => (
                        <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g. Mathematics" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={tutorForm.control} name="fees" render={({ field }) => (
                          <FormItem><FormLabel>Fees (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={tutorForm.control} name="feesLabel" render={({ field }) => (
                          <FormItem><FormLabel>Per</FormLabel><FormControl><Input placeholder="e.g. month, hour" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={tutorForm.control} name="city" render={({ field }) => (
                          <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={tutorForm.control} name="mode" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mode</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="online">Online</SelectItem>
                                <SelectItem value="offline">Offline</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={tutorForm.control} name="contactEmail" render={({ field }) => (
                        <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={tutorForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={createTutor.isPending}>
                        {createTutor.isPending ? "Posting..." : "Post Listing"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><BookOpen className="w-5 h-5 text-muted-foreground" /> My Active Listings</h2>
              {isTutorsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : tutorListings && tutorListings.length > 0 ? (
                tutorListings.map(tutor => (
                  <Card key={tutor.id} className="overflow-hidden bg-white shadow-sm border-border">
                    <CardContent className="p-6 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{tutor.subject}</h3>
                          <Badge variant="secondary" className="capitalize">{tutor.mode}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {tutor.city}</span>
                          <span className="flex items-center gap-1 font-bold text-emerald-600"><IndianRupee className="w-4 h-4" /> {tutor.fees} / {tutor.feesLabel}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTutor(tutor.id)} disabled={deleteTutor.isPending}>
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-dashed rounded-xl text-muted-foreground">
                  No listings active. Create one to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {isEmployer && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card className="bg-white border-border shadow-sm sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-primary" /> Post Opportunity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...internshipForm}>
                    <form onSubmit={internshipForm.handleSubmit(onInternshipSubmit)} className="space-y-4">
                      <FormField control={internshipForm.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input placeholder="e.g. Marketing Intern" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={internshipForm.control} name="type" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="internship">Internship</SelectItem>
                                <SelectItem value="part_time">Part-time</SelectItem>
                                <SelectItem value="freelance">Freelance</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={internshipForm.control} name="location" render={({ field }) => (
                          <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="City or Remote" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={internshipForm.control} name="payment" render={({ field }) => (
                          <FormItem><FormLabel>Pay (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={internshipForm.control} name="paymentLabel" render={({ field }) => (
                          <FormItem><FormLabel>Per</FormLabel><FormControl><Input placeholder="e.g. month" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={internshipForm.control} name="skills" render={({ field }) => (
                        <FormItem><FormLabel>Skills (comma separated)</FormLabel><FormControl><Input placeholder="e.g. Excel, Communication" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={internshipForm.control} name="applyEmail" render={({ field }) => (
                          <FormItem><FormLabel>Apply Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={internshipForm.control} name="applyLink" render={({ field }) => (
                          <FormItem><FormLabel>Apply Link</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={internshipForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="h-24" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={createInternship.isPending}>
                        {createInternship.isPending ? "Posting..." : "Post Opportunity"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Briefcase className="w-5 h-5 text-muted-foreground" /> My Opportunities</h2>
              {isInternshipsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : internshipListings && internshipListings.length > 0 ? (
                internshipListings.map(job => (
                  <Card key={job.id} className="overflow-hidden bg-white shadow-sm border-border">
                    <CardContent className="p-6 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{job.title}</h3>
                          <Badge className="capitalize bg-primary/10 text-primary">{job.type.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                          <span className="flex items-center gap-1 font-bold text-emerald-600"><IndianRupee className="w-4 h-4" /> {job.payment} / {job.paymentLabel}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteInternship(job.id)} disabled={deleteInternship.isPending}>
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-dashed rounded-xl text-muted-foreground">
                  No opportunities posted yet. Create one to get started.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}