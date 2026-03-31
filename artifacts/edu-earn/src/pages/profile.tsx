import { useGetProfile, getGetProfileQueryKey, useGetCompletedTasks, getGetCompletedTasksQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Flame, Target, IndianRupee, Mail, Calendar, CheckCircle2, Award } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { data: profile, isLoading: isProfileLoading } = useGetProfile({
    query: { queryKey: getGetProfileQueryKey() }
  });

  const { data: history, isLoading: isHistoryLoading } = useGetCompletedTasks({
    query: { queryKey: getGetCompletedTasksQueryKey() }
  });

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        
        {/* Profile Header */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-border flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          
          <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-5xl font-bold text-white shadow-xl shadow-primary/30 shrink-0 border-4 border-white z-10">
            {isProfileLoading ? <Skeleton className="w-full h-full rounded-full" /> : profile?.user.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="text-center md:text-left flex-1 z-10">
            {isProfileLoading ? (
              <div className="space-y-3 flex flex-col items-center md:items-start">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-5 w-48" />
              </div>
            ) : profile ? (
              <>
                <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">{profile.user.name}</h1>
                <div className="flex flex-col sm:flex-row items-center gap-4 text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {profile.user.email}</span>
                  <span className="hidden sm:inline text-border">•</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {format(new Date(profile.user.createdAt), 'MMM yyyy')}</span>
                </div>
              </>
            ) : null}
            
            <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-3">
              <div className="bg-slate-50 px-4 py-2 rounded-xl border border-border flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-bold text-slate-700">Rank #{profile?.rank || '-'}</span>
              </div>
              <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-600 fill-orange-600" />
                <span className="font-bold text-orange-800">{profile?.user.streak || 0} Day Streak</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="bg-white border-border shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div className="text-sm font-bold text-muted-foreground mb-1 uppercase tracking-wider">Total Points</div>
              <div className="text-3xl font-extrabold text-foreground">
                {isProfileLoading ? <Skeleton className="h-8 w-24 mx-auto" /> : profile?.user.points.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-border shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <IndianRupee className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-sm font-bold text-muted-foreground mb-1 uppercase tracking-wider">Total Earned</div>
              <div className="text-3xl font-extrabold text-emerald-600">
                {isProfileLoading ? <Skeleton className="h-8 w-24 mx-auto" /> : `₹${profile?.totalRewardsEarned.toLocaleString()}`}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-border shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-sm font-bold text-muted-foreground mb-1 uppercase tracking-wider">Tasks Completed</div>
              <div className="text-3xl font-extrabold text-foreground">
                {isProfileLoading ? <Skeleton className="h-8 w-24 mx-auto" /> : profile?.totalTasksCompleted}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card className="bg-white border-border shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" /> Completion History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {isHistoryLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-5 flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                ))
              ) : history && history.length > 0 ? (
                history.map(task => (
                  <div key={task.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-base">{task.taskTitle}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="capitalize font-semibold">{task.category}</span>
                          <span>•</span>
                          <span>{format(new Date(task.completedAt), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-1 pl-14 sm:pl-0">
                      <div className="font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
                        <IndianRupee className="w-3.5 h-3.5" /> {task.reward}
                      </div>
                      <div className="text-sm font-bold text-muted-foreground">
                        {task.points} pts
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-1">No completed tasks yet</h3>
                  <p className="text-muted-foreground">Start completing tasks to build your history.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}