import { useState } from "react";
import { useGetLeaderboard, getGetLeaderboardQueryKey, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Flame, Target, Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const [period, setPeriod] = useState<"weekly" | "alltime">("weekly");

  const { data: user } = useGetMe({ 
    query: { queryKey: getGetMeQueryKey() } 
  });

  const { data: leaderboardData, isLoading } = useGetLeaderboard(
    { period },
    { query: { queryKey: getGetLeaderboardQueryKey({ period }) } }
  );

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case 2: return "bg-slate-100 text-slate-700 border-slate-200";
      case 3: return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-transparent text-muted-foreground border-transparent";
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5" />;
      case 2: return <Medal className="w-5 h-5" />;
      case 3: return <Medal className="w-5 h-5" />;
      default: return <span className="font-bold">{rank}</span>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6 pb-8 max-w-4xl mx-auto">
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Leaderboard</h1>
          <p className="text-lg text-muted-foreground">Compete with peers and climb the ranks.</p>
        </div>

        <div className="flex justify-center mb-8">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full max-w-md">
            <TabsList className="grid grid-cols-2 h-12 p-1 bg-white border shadow-sm">
              <TabsTrigger value="weekly" className="text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-white">This Week</TabsTrigger>
              <TabsTrigger value="alltime" className="text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-white">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="bg-white border-border shadow-md overflow-hidden">
          <CardContent className="p-0">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b bg-slate-50/50 text-sm font-bold text-muted-foreground">
              <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
              <div className="col-span-5 sm:col-span-6">Student</div>
              <div className="col-span-3 sm:col-span-3 text-right">Points</div>
              <div className="col-span-2 sm:col-span-2 text-right">Streak</div>
            </div>

            {/* List */}
            <div className="divide-y divide-border/50">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="p-4 grid grid-cols-12 gap-4 items-center">
                    <Skeleton className="h-6 w-6 col-span-1 mx-auto rounded-full" />
                    <div className="col-span-6 flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-5 w-16 col-span-3 ml-auto" />
                    <Skeleton className="h-5 w-12 col-span-2 ml-auto" />
                  </div>
                ))
              ) : leaderboardData?.entries && leaderboardData.entries.length > 0 ? (
                leaderboardData.entries.map((entry) => (
                  <div 
                    key={entry.userId} 
                    className={cn(
                      "p-4 grid grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50",
                      entry.isCurrentUser && "bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary"
                    )}
                  >
                    <div className="col-span-2 sm:col-span-1 flex justify-center">
                      <div className={cn("w-8 h-8 flex items-center justify-center rounded-full border-2", getRankStyle(entry.rank))}>
                        {getRankIcon(entry.rank)}
                      </div>
                    </div>
                    
                    <div className="col-span-5 sm:col-span-6 flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm",
                        entry.isCurrentUser ? "bg-primary" : "bg-slate-800"
                      )}>
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">
                          {entry.name}
                          {entry.isCurrentUser && <span className="ml-2 text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full">You</span>}
                        </div>
                        <div className="text-xs text-muted-foreground hidden sm:block">
                          {entry.tasksCompleted} tasks completed
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3 sm:col-span-3 text-right font-extrabold text-foreground flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1 sm:gap-1.5">
                      <Target className="w-4 h-4 text-primary hidden sm:block" />
                      {entry.points.toLocaleString()}
                    </div>

                    <div className="col-span-2 sm:col-span-2 text-right font-bold flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1 sm:gap-1.5 text-accent">
                      <Flame className="w-4 h-4 fill-accent hidden sm:block" />
                      {entry.streak}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  No data available for this period.
                </div>
              )}
            </div>
            
            {/* Current User Fixed Footer if not in top 10 (simulated by checking if they are in the list) */}
            {leaderboardData?.entries && user && !leaderboardData.entries.some(e => e.isCurrentUser) && leaderboardData.currentUserRank && (
              <div className="border-t-4 border-primary bg-primary/5 p-4 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2 sm:col-span-1 flex justify-center">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full border-2 bg-slate-100 text-slate-700 border-slate-200 font-bold">
                    {leaderboardData.currentUserRank}
                  </div>
                </div>
                
                <div className="col-span-5 sm:col-span-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm bg-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">
                      {user.name}
                      <span className="ml-2 text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full">You</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-3 sm:col-span-3 text-right font-extrabold text-foreground flex items-center justify-end gap-1.5">
                  <Target className="w-4 h-4 text-primary hidden sm:block" />
                  {user.points.toLocaleString()}
                </div>

                <div className="col-span-2 sm:col-span-2 text-right font-bold flex items-center justify-end gap-1.5 text-accent">
                  <Flame className="w-4 h-4 fill-accent hidden sm:block" />
                  {user.streak}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}