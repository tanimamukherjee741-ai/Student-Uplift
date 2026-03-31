import { useState } from "react";
import { useGetTasks, getGetTasksQueryKey, useCompleteTask, getGetDashboardSummaryQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndianRupee, BookOpen, Briefcase, Zap, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Tasks() {
  const [filter, setFilter] = useState<"all" | "study" | "gig">("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryParams = { 
    completed: false,
    ...(filter !== "all" ? { category: filter } : {}) 
  } as any;

  const { data: tasks, isLoading } = useGetTasks(
    queryParams,
    { query: { queryKey: getGetTasksQueryKey(queryParams) } }
  );

  const completeTask = useCompleteTask();

  const handleCompleteTask = (id: number) => {
    completeTask.mutate({ id }, {
      onSuccess: (res) => {
        toast({
          title: "Task Completed!",
          description: `You earned ₹${res.rewardEarned} and ${res.pointsEarned} points!`,
        });
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
    });
  };

  const CategoryIcon = ({ category }: { category: string }) => {
    switch (category) {
      case 'study': return <BookOpen className="w-4 h-4" />;
      case 'gig': return <Briefcase className="w-4 h-4" />;
      case 'challenge': return <Zap className="w-4 h-4" />;
      default: return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'study': return 'bg-blue-500';
      case 'gig': return 'bg-purple-500';
      case 'challenge': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const getBadgeClass = (category: string) => {
    switch (category) {
      case 'study': return 'text-blue-700 bg-blue-100';
      case 'gig': return 'text-purple-700 bg-purple-100';
      case 'challenge': return 'text-amber-700 bg-amber-100 border-amber-200 border';
      default: return 'text-slate-700 bg-slate-100';
    }
  };

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Tasks & Gigs</h1>
          <p className="text-muted-foreground mt-1">Complete tasks to earn rupees and build your streak.</p>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="bg-white border shadow-sm mb-6 h-12 p-1">
            <TabsTrigger value="all" className="h-full px-6 font-semibold data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all">All Tasks</TabsTrigger>
            <TabsTrigger value="study" className="h-full px-6 font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md transition-all">Study</TabsTrigger>
            <TabsTrigger value="gig" className="h-full px-6 font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-md transition-all">Gigs</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))
            ) : tasks && tasks.length > 0 ? (
              tasks.map(task => (
                <Card key={task.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group border-border/50 flex flex-col h-full hover:-translate-y-1 bg-white">
                  <div className={`h-1.5 w-full ${getCategoryColor(task.category)}`} />
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${getBadgeClass(task.category)}`}>
                        <CategoryIcon category={task.category} />
                        {task.category}
                      </span>
                      <div className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-sm">
                        <IndianRupee className="w-3.5 h-3.5" /> {task.reward}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-foreground text-lg mb-2 leading-tight group-hover:text-primary transition-colors">{task.title}</h3>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/40">
                      <span className="text-sm font-bold text-muted-foreground bg-slate-50 px-2 py-1 rounded">
                        {task.points} pts
                      </span>
                      <Button 
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={completeTask.isPending}
                        className="shadow-sm font-semibold px-6"
                      >
                        Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-16 h-16 text-muted-foreground/20 mb-4" />
                <h3 className="font-bold text-xl text-foreground mb-2">No tasks available</h3>
                <p className="text-muted-foreground max-w-sm">You've completed all tasks in this category. Check back later for more opportunities to earn!</p>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </Layout>
  );
}