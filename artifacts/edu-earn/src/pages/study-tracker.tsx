import { useState, useEffect, useRef } from "react";
import { 
  useGetTodayStudyStats, getGetTodayStudyStatsQueryKey,
  useGetStudyHistory, getGetStudyHistoryQueryKey,
  useLogStudySession, getGetMeQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Square, RotateCcw, Award, Flame, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { format, parseISO } from "date-fns";

export default function StudyTracker() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: stats, isLoading: isStatsLoading } = useGetTodayStudyStats({
    query: { queryKey: getGetTodayStudyStatsQueryKey() }
  });

  const { data: history, isLoading: isHistoryLoading } = useGetStudyHistory({
    query: { queryKey: getGetStudyHistoryQueryKey() }
  });

  const logSession = useLogStudySession();

  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    setIsRunning(false);
    if (time > 0) {
      const durationSeconds = time;
      logSession.mutate({ data: { durationSeconds } }, {
        onSuccess: (res) => {
          toast({
            title: "Session Logged!",
            description: res.message || `Great! You studied for ${res.sessionMinutes} minutes!`,
          });
          queryClient.invalidateQueries({ queryKey: getGetTodayStudyStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStudyHistoryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setTime(0);
        }
      });
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  const goalMinutes = stats?.goalMinutes || 120;
  const progressPercent = stats ? Math.min((stats.totalMinutes / goalMinutes) * 100, 100) : 0;

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Study Tracker</h1>
          <p className="text-muted-foreground mt-1">Focus deeply and track your study time to earn points.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Timer Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white border-border shadow-md overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
              <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center relative z-10">
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border-[12px] border-primary/10 flex items-center justify-center mb-8 relative shadow-inner">
                  <div className={`absolute inset-0 rounded-full border-[12px] border-primary transition-all duration-1000 ${isRunning ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`} style={{ borderStyle: isRunning ? 'dashed' : 'solid' }}></div>
                  <div className="text-6xl sm:text-7xl font-black text-primary font-mono tracking-tighter">
                    {formatTime(time)}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button 
                    size="lg" 
                    className={`w-24 h-16 rounded-2xl ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'} text-white shadow-lg`}
                    onClick={toggleTimer}
                  >
                    {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="destructive"
                    className="w-24 h-16 rounded-2xl shadow-lg"
                    onClick={handleStop}
                    disabled={time === 0 && !isRunning}
                  >
                    <Square className="w-6 h-6 fill-current" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-16 h-16 rounded-2xl"
                    onClick={handleReset}
                    disabled={time === 0}
                  >
                    <RotateCcw className="w-6 h-6" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-border shadow-sm">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-xl">Last 7 Days</CardTitle>
                <CardDescription>Your study consistency over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isHistoryLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : history && history.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={history.map(d => ({ ...d, formattedDate: format(parseISO(d.date), 'MMM d') }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="totalMinutes" name="Minutes" radius={[4, 4, 0, 0]}>
                          {history.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.totalMinutes >= goalMinutes ? '#10b981' : '#6366f1'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground bg-slate-50 rounded-xl border border-dashed">
                    No history yet. Start studying!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Stats */}
          <div className="space-y-6">
            <Card className="bg-white border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Today's Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {isStatsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : stats ? (
                  <div className="space-y-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-4xl font-extrabold text-primary">{stats.totalMinutes}</div>
                        <div className="text-sm font-medium text-muted-foreground mt-1">mins studied</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-foreground">/ {stats.goalMinutes}</div>
                        <div className="text-sm font-medium text-muted-foreground mt-1">daily goal</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress value={progressPercent} className="h-3" />
                      <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>0%</span>
                        <span>{Math.round(progressPercent)}%</span>
                      </div>
                    </div>

                    {stats.goalReached && (
                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl flex items-center gap-3">
                        <Award className="w-8 h-8 text-emerald-500 shrink-0" />
                        <div>
                          <p className="font-bold">Goal Reached!</p>
                          <p className="text-xs mt-0.5">You've hit your daily target. Keep it up!</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary to-accent/80 text-white shadow-md border-none">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl shrink-0">
                    <Flame className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Why study here?</h3>
                    <p className="text-white/90 text-sm mt-2 leading-relaxed">
                      Time logged translates to points. Hit your daily goal to build your streak and climb the leaderboard!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}