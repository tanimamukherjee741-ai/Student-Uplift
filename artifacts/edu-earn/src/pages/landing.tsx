import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Trophy, CheckCircle2, Flame, ArrowRight, Zap } from "lucide-react";

export default function Landing() {
  const [_, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({ 
    query: { 
      queryKey: getGetMeQueryKey(),
      retry: false
    } 
  });

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col overflow-hidden">
      {/* Navbar */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 text-2xl font-bold text-slate-900 tracking-tight">
          <div className="bg-primary text-white p-1.5 rounded-lg shadow-sm">
            <Trophy className="w-6 h-6" />
          </div>
          EduEarn
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" asChild className="font-semibold hidden sm:inline-flex">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className="font-semibold px-6 shadow-md shadow-primary/20">
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-amber-700 text-sm font-bold mb-8 border border-accent/20">
          <Zap className="w-4 h-4 fill-amber-700" />
          The ultimate productivity game
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl leading-tight mb-6">
          Turn your <span className="text-primary">study time</span> into real rewards.
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mb-12 leading-relaxed">
          Complete study tasks, take on small gigs, and climb the leaderboard. EduEarn makes learning feel like a game you actually want to play.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/30" asChild>
            <Link href="/register">
              Start Earning Now <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold bg-white border-slate-200" asChild>
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-left">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Complete Tasks</h3>
            <p className="text-slate-600">Knock out study assignments and mini-gigs to earn points and rupees directly to your account.</p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-left">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
              <Flame className="w-6 h-6 fill-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Build Your Streak</h3>
            <p className="text-slate-600">Show up daily to build an unstoppable streak. Unlock bonuses and special challenges as you progress.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-left">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Climb the Ranks</h3>
            <p className="text-slate-600">Compete with other students on the weekly and all-time leaderboards. Earn bragging rights.</p>
          </div>
        </div>
      </main>
    </div>
  );
}