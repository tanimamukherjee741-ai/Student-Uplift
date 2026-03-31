import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetTodayChallenge, getGetTodayChallengeQueryKey, useGetTasks, getGetTasksQueryKey, useCompleteTask, useCompleteChallenge, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Flame, Target, CheckCircle2, IndianRupee, Clock, ArrowRight, Zap, BookOpen, Briefcase, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: challenge, isLoading: isLoadingChallenge } = useGetTodayChallenge({
    query: { queryKey: getGetTodayChallengeQueryKey() }
  });

  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks(
    { completed: false },
    { query: { queryKey: getGetTasksQueryKey({ completed: false }) } }
  );

  const completeTask = useCompleteTask();
  const completeChallenge = useCompleteChallenge();

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

  const handleCompleteChallenge = (id: number) => {
    completeChallenge.mutate({ id }, {
      onSuccess: (res) => {
        toast({
          title: "Daily Challenge Completed!",
          description: `You earned ₹${res.rewardEarned} and ${res.pointsEarned} points!`,
        });
        queryClient.invalidateQueries({ queryKey: getGetTodayChallengeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Here is what is happening today.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20">
            <CardContent className="p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-primary-foreground/80">Total Points</span>
                <Target className="w-5 h-5 text-primary-foreground/80" />
              </div>
              <div className="text-4xl font-extrabold">
                {isLoadingSummary ? <Skeleton className="h-10 w-24 bg-primary-foreground/20" /> : summary?.totalPoints}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-border shadow-sm">
            <CardContent className="p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-muted-foreground">Current Streak</span>
                <Flame className="w-5 h-5 fill-accent text-accent" />
              </div>
              <div className="text-4xl font-extrabold text-foreground">
                {isLoadingSummary ? <Skeleton className="h-10 w-24" /> : `${summary?.currentStreak} days`}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-border shadow-sm">
            <CardContent className="p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-muted-foreground">Total Earned</span>
                <IndianRupee className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-4xl font-extrabold text-emerald-600">
                {isLoadingSummary ? <Skeleton className="h-10 w-24" /> : `₹${summary?.totalRewardsEarned}`}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-border shadow-sm">
            <CardContent className="p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-muted-foreground">Tasks Today</span>
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-4xl font-extrabold text-foreground">
                {isLoadingSummary ? <Skeleton className="h-10 w-24" /> : summary?.tasksCompletedToday}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Daily Challenge */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent to-primary rounded-2xl blur opacity-20"></div>
              <Card className="relative bg-white border-accent/20 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full -mr-10 -mt-10" />
                <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-amber-700 text-xs font-bold mb-3 border border-accent/20">
                      <Zap className="w-3.5 h-3.5 fill-amber-700" />
                      Daily Challenge
                    </div>
                    {isLoadingChallenge ? (
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : challenge ? (
                      <>
                        <h2 className="text-2xl font-bold text-foreground mb-2">{challenge.title}</h2>
                        <p className="text-muted-foreground text-sm">{challenge.description}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                          <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-md">
                            <IndianRupee className="w-4 h-4" /> {challenge.reward} (+₹{challenge.bonusReward} bonus)
                          </div>
                          <div className="flex items-center gap-1.5 text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-md">
                            <Target className="w-4 h-4" /> {challenge.points} pts
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No challenge available today.</p>
                    )}
                  </div>
                  {challenge && !challenge.completed && (
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto shrink-0 shadow-md bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={() => handleCompleteChallenge(challenge.id)}
                      disabled={completeChallenge.isPending}
                    >
                      {completeChallenge.isPending ? "Completing..." : "Complete Challenge"}
                    </Button>
                  )}
                  {challenge?.completed && (
                    <div className="flex items-center gap-2 text-emerald-600 font-bold w-full sm:w-auto justify-center bg-emerald-50 px-6 py-3 rounded-xl border border-emerald-100">
                      <CheckCircle2 className="w-5 h-5" /> Completed
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/study-tracker">
                <Card className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer border-none shadow-md h-full">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">Study Timer</h3>
                      <p className="text-primary-foreground/80 text-sm mt-1">Start tracking your focus</p>
                    </div>
                    <Clock className="w-8 h-8 opacity-80" />
                  </CardContent>
                </Card>
              </Link>

              {summary?.streamName ? (
                <Link href="/streams">
                  <Card className="bg-white border-border hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">Your Stream</h3>
                        <p className="text-muted-foreground text-sm mt-1">{summary.streamName}</p>
                      </div>
                      <Users className="w-8 h-8 text-primary opacity-80" />
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <Link href="/streams">
                  <Card className="bg-white border-border hover:shadow-md transition-shadow cursor-pointer border-dashed h-full">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">Join a Stream</h3>
                        <p className="text-muted-foreground text-sm mt-1">Find your classmates</p>
                      </div>
                      <Users className="w-8 h-8 text-muted-foreground opacity-50" />
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>

            {/* Tasks List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground tracking-tight">Today's Tasks</h3>
                <Button variant="ghost" className="text-primary font-semibold hover:bg-primary/5" asChild>
                  <Link href="/tasks">View All <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </div>
              
              <div className="space-y-3">
                {isLoadingTasks ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))
                ) : tasks && tasks.length > 0 ? (
                  tasks.slice(0, 5).map(task => (
                    <Card key={task.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200 group border-border/50">
                      <CardContent className="p-0 flex items-stretch">
                        <div className={`w-2 ${task.category === 'study' ? 'bg-blue-500' : task.category === 'gig' ? 'bg-purple-500' : 'bg-orange-500'}`} />
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between flex-1">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              {task.category === 'study' && <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full"><BookOpen className="w-3 h-3" /> Study</span>}
                              {task.category === 'gig' && <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full"><Briefcase className="w-3 h-3" /> Gig</span>}
                            </div>
                            <h4 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">{task.title}</h4>
                            {task.description && <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{task.description}</p>}
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                            <div className="flex flex-row sm:flex-col gap-3 sm:gap-0 text-sm font-semibold text-right">
                              <span className="flex items-center gap-1 text-emerald-600">
                                <IndianRupee className="w-3.5 h-3.5" /> {task.reward}
                              </span>
                              <span className="text-muted-foreground text-xs">{task.points} pts</span>
                            </div>
                            <Button 
                              onClick={() => handleCompleteTask(task.id)}
                              disabled={completeTask.isPending}
                              className="shadow-sm"
                            >
                              Complete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-border">
                    <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="font-semibold text-lg text-foreground">All caught up!</h3>
                    <p className="text-muted-foreground text-sm">You've completed all your tasks for now.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            <Card className="bg-white border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-0">
                <div className="space-y-0">
                  {isLoadingSummary ? (
                    <div className="p-4 space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : summary?.recentActivity && summary.recentActivity.length > 0 ? (
                    summary.recentActivity.map((activity, i) => (
                      <div key={activity.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors border-l-2 border-transparent hover:border-primary">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground line-clamp-2">Completed "{activity.taskTitle}"</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5"><IndianRupee className="w-3 h-3" />{activity.reward}</span>
                            <span className="text-xs text-muted-foreground font-medium">{activity.points} pts</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                      No recent activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}