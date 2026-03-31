import { useState } from "react";
import { useGetTutors, getGetTutorsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, BookOpen, IndianRupee, Mail } from "lucide-react";

export default function FindTutors() {
  const [city, setCity] = useState("");
  const [subject, setSubject] = useState("");
  
  const [debouncedCity, setDebouncedCity] = useState("");
  const [debouncedSubject, setDebouncedSubject] = useState("");

  const handleSearch = () => {
    setDebouncedCity(city);
    setDebouncedSubject(subject);
  };

  const { data: tutors, isLoading } = useGetTutors({ 
    city: debouncedCity || undefined, 
    subject: debouncedSubject || undefined 
  }, {
    query: { queryKey: getGetTutorsQueryKey({ city: debouncedCity || undefined, subject: debouncedSubject || undefined }) }
  });

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Find Tutors</h1>
          <p className="text-muted-foreground mt-1">Discover expert tutors and coaching classes in your city.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Subject (e.g. Math, Science)" 
              className="pl-9"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="City" 
              className="pl-9"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <Button onClick={handleSearch} className="px-8">Search</Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
          </div>
        ) : tutors && tutors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map(tutor => (
              <Card key={tutor.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{tutor.teacherName}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3.5 h-3.5" /> {tutor.city}
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize">{tutor.mode}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary">
                      <BookOpen className="w-3 h-3 mr-1" /> {tutor.subject}
                    </Badge>
                  </div>

                  {tutor.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {tutor.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                    <div className="flex items-center gap-1 font-bold text-emerald-600">
                      <IndianRupee className="w-4 h-4" /> {tutor.fees} <span className="text-xs text-muted-foreground font-normal">/ {tutor.feesLabel}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = `mailto:${tutor.contactEmail}`}>
                      <Mail className="w-4 h-4 mr-2" /> Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold text-lg text-foreground">No tutors found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}