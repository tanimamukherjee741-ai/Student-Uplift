import { useState } from "react";
import { 
  useGetStreams, getGetStreamsQueryKey,
  useJoinStream,
  useGetStreamMembers, getGetStreamMembersQueryKey,
  useGetStreamLeaderboard, getGetStreamLeaderboardQueryKey,
  useGetMe, getGetMeQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, Trophy, Flame, Search, Target, Swords, PlusCircle } from "lucide-react";
import { Link } from "wouter";

export default function Streams() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { data: user, isLoading: isUserLoading } = useGetMe({ 
    query: { queryKey: getGetMeQueryKey() } 
  });

  const { data: streams, isLoading: isStreamsLoading } = useGetStreams({
    query: { queryKey: getGetStreamsQueryKey() }
  });

  const joinStream = useJoinStream();

  const handleJoin = (stream: string) => {
    joinStream.mutate({ data: { stream } }, {
      onSuccess: () => {
        toast({ title: "Joined stream!", description: `You are now in ${stream}` });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStreamsQueryKey() });
      }
    });
  };

  const myStream = user?.stream;

  const { data: members, isLoading: isMembersLoading } = useGetStreamMembers(
    myStream || "", 
    { query: { queryKey: getGetStreamMembersQueryKey(myStream || ""), enabled: !!myStream } }
  );

  const { data: leaderboard, isLoading: isLeaderboardLoading } = useGetStreamLeaderboard({
    query: { queryKey: getGetStreamLeaderboardQueryKey(), enabled: !!myStream }
  });

  const handleChallenge = () => {
    toast({
      title: "Coming Soon!",
      description: "Direct challenges are being built right now.",
    });
  };

  const filteredStreams = streams?.filter(s => s.stream.toLowerCase().includes(search.toLowerCase())) || [];

  if (isUserLoading) return <Layout><div className="p-8"><Skeleton className="h-64 w-full" /></div></Layout>;

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Study Partners</h1>
          <p className="text-muted-foreground mt-1">Join a stream to find classmates and compete.</p>
        </div>

        {!myStream ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="bg-primary text-primary-foreground border-none shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
              <CardContent className="p-8 text-center relative z-10">
                <Users className="w-16 h-16 mx-auto mb-6 opacity-90" />
                <h2 className="text-2xl font-bold mb-2">Find your class</h2>
                <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
                  Join a stream to connect with people studying the same things, share progress, and compete on the stream leaderboard.
                </p>
                <div className="relative max-w-md mx-auto text-foreground">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search streams (e.g. Class 10, B.Tech)" 
                    className="pl-10 h-12 text-lg bg-white border-none shadow-inner"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isStreamsLoading ? (
                [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
              ) : filteredStreams.length > 0 ? (
                filteredStreams.map(s => (
                  <Card key={s.stream} className="hover:border-primary cursor-pointer transition-colors group" onClick={() => handleJoin(s.stream)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{s.stream}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Users className="w-3.5 h-3.5" /> {s.memberCount} members
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" disabled={joinStream.isPending}>Join</Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full p-8 text-center text-muted-foreground bg-white rounded-xl border border-dashed">
                  No streams found. <br />
                  {search && (
                    <Button variant="link" className="mt-2 text-primary font-bold" onClick={() => handleJoin(search)} disabled={joinStream.isPending}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Create "{search}"
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: My Stream Info & Leaderboard */}
            <div className="space-y-6">
              <Card className="bg-white border-border shadow-sm overflow-hidden">
                <div className="bg-primary/5 p-6 border-b border-border/50 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg mb-4 rotate-3">
                    <Users className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{myStream}</h2>
                  <p className="text-muted-foreground mt-1">{members?.length || 0} classmates</p>
                </div>
                <CardContent className="p-0">
                  <div className="p-4 bg-slate-50/50 flex justify-between items-center text-sm font-semibold">
                    <span className="text-muted-foreground">Your Rank</span>
                    <span className="text-primary text-lg flex items-center gap-1"><Trophy className="w-4 h-4" /> #{leaderboard?.currentUserRank || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-accent" /> Stream Top 5
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {isLeaderboardLoading ? (
                      [1,2,3].map(i => <div key={i} className="p-4"><Skeleton className="h-8 w-full" /></div>)
                    ) : leaderboard?.entries.slice(0, 5).map(entry => (
                      <div key={entry.userId} className={`p-4 flex items-center justify-between ${entry.isCurrentUser ? 'bg-primary/5' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${entry.rank === 1 ? 'bg-accent text-accent-foreground' : entry.rank === 2 ? 'bg-slate-200 text-slate-700' : entry.rank === 3 ? 'bg-amber-700 text-white' : 'text-muted-foreground'}`}>
                            {entry.rank}
                          </div>
                          <span className={`font-semibold ${entry.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>{entry.name} {entry.isCurrentUser && '(You)'}</span>
                        </div>
                        <span className="font-bold text-muted-foreground text-sm">{entry.points} pts</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Members List */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white border-border shadow-sm">
                <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between py-4">
                  <CardTitle className="text-xl">Classmates</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => joinStream.mutate({ data: { stream: "" } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }) } })}>
                    Leave Stream
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {isMembersLoading ? (
                      [1,2,3,4,5].map(i => <div key={i} className="p-5 flex gap-4"><Skeleton className="h-12 w-12 rounded-full" /><Skeleton className="h-12 flex-1" /></div>)
                    ) : members?.map(member => (
                      <div key={member.userId} className={`p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-slate-50 transition-colors ${member.isCurrentUser ? 'bg-primary/5 hover:bg-primary/10' : ''}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground flex items-center gap-2">
                              {member.name} {member.isCurrentUser && <span className="text-[10px] uppercase tracking-wider bg-primary text-white px-2 py-0.5 rounded-full">You</span>}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1 font-semibold text-orange-600"><Flame className="w-3.5 h-3.5 fill-orange-600" /> {member.streak} days</span>
                              <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {member.tasksCompleted} tasks</span>
                            </div>
                          </div>
                        </div>
                        
                        {!member.isCurrentUser && (
                          <div className="flex items-center justify-end">
                            <Button variant="secondary" size="sm" className="w-full sm:w-auto hover:bg-primary hover:text-white" onClick={handleChallenge}>
                              <Swords className="w-4 h-4 mr-2" /> Challenge
                            </Button>
                          </div>
                        )}
                        {member.isCurrentUser && (
                          <div className="text-right">
                            <span className="font-bold text-primary text-lg">{member.points} pts</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}