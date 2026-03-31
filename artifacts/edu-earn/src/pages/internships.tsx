import { useState } from "react";
import { useGetInternships, getGetInternshipsQueryKey } from "@workspace/api-client-react";
import type { GetInternshipsType } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Briefcase, IndianRupee, ExternalLink } from "lucide-react";

export default function Internships() {
  const [location, setLocation] = useState("");
  const [debouncedLocation, setDebouncedLocation] = useState("");
  const [type, setType] = useState<GetInternshipsType | "all">("all");

  const handleSearch = () => {
    setDebouncedLocation(location);
  };

  const { data: internships, isLoading } = useGetInternships({ 
    location: debouncedLocation || undefined,
    type: type !== "all" ? type as GetInternshipsType : undefined
  }, {
    query: { queryKey: getGetInternshipsQueryKey({ 
      location: debouncedLocation || undefined,
      type: type !== "all" ? type as GetInternshipsType : undefined
    }) }
  });

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Internships & Work</h1>
          <p className="text-muted-foreground mt-1">Find part-time jobs, internships, and freelance gigs.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-border">
          <Tabs value={type} onValueChange={(v) => setType(v as GetInternshipsType | "all")} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="internship">Internships</TabsTrigger>
              <TabsTrigger value="part_time">Part-time</TabsTrigger>
              <TabsTrigger value="freelance">Freelance</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Location" 
                className="pl-9"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch}>Filter</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
        ) : internships && internships.length > 0 ? (
          <div className="space-y-4">
            {internships.map(job => (
              <Card key={job.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 justify-between md:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="capitalize bg-primary text-primary-foreground">
                        {job.type.replace("_", " ")}
                      </Badge>
                      <span className="text-sm font-semibold text-muted-foreground">{job.employerName}</span>
                    </div>
                    <h3 className="font-bold text-xl text-foreground mb-2">{job.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</div>
                      <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                        <IndianRupee className="w-4 h-4" /> {job.payment} <span className="font-normal text-muted-foreground">/ {job.paymentLabel}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 max-w-3xl">
                      {job.description}
                    </p>
                    
                    {job.skills && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.skills.split(",").map(s => s.trim()).map(skill => (
                          <Badge key={skill} variant="secondary" className="bg-slate-100">{skill}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
                    {job.applyLink && (
                      <Button className="w-full" asChild>
                        <a href={job.applyLink} target="_blank" rel="noopener noreferrer">
                          Apply Now <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    )}
                    {job.applyEmail && (
                      <Button variant={job.applyLink ? "outline" : "default"} className="w-full" onClick={() => window.location.href = `mailto:${job.applyEmail}`}>
                        Email Employer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-border">
            <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold text-lg text-foreground">No opportunities found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}