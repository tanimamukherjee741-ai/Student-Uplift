import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { 
  useGetMe, 
  useDailyCheckin, 
  useLogout, 
  getGetMeQueryKey,
  useGetNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Trophy, 
  User as UserIcon,
  Bell,
  Flame,
  LogOut,
  Menu,
  CheckCircle2,
  Clock,
  Users,
  Search,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading: isUserLoading } = useGetMe({ 
    query: { 
      queryKey: getGetMeQueryKey(),
      retry: false
    } 
  });
  
  const dailyCheckin = useDailyCheckin();
  const logout = useLogout();
  const { data: notifications = [] } = useGetNotifications({
    query: {
      queryKey: ["notifications"],
      enabled: !!user,
    }
  });
  const markNotificationRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!isUserLoading && !user) {
      setLocation("/login");
    } else if (user) {
      // Do daily checkin
      dailyCheckin.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        }
      });
    }
  }, [user, isUserLoading, setLocation]);

  if (isUserLoading || !user) {
    return null; // or a loading spinner
  }

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation("/");
      }
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(user?.role === 'student' ? [
      { href: "/tasks", label: "Tasks & Gigs", icon: CheckSquare },
      { href: "/study-tracker", label: "Study Tracker", icon: Clock },
      { href: "/streams", label: "Study Partners", icon: Users },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ] : []),
    { href: "/find-tutors", label: "Find Tutors", icon: Search },
    { href: "/internships", label: "Internships", icon: Briefcase },
    ...(user?.role === 'teacher' || user?.role === 'employer' ? [
      { href: "/teacher-dashboard", label: "My Dashboard", icon: LayoutDashboard },
    ] : []),
    { href: "/profile", label: "Profile", icon: UserIcon },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-2xl font-bold text-white tracking-tight">
            <div className="bg-primary text-white p-1.5 rounded-lg">
              <Trophy className="w-6 h-6" />
            </div>
            EduEarn
          </Link>
        </div>
        
        <div className="px-4 py-2">
          <div className="bg-sidebar-accent/50 rounded-xl p-4 flex flex-col gap-2 border border-sidebar-border/50">
            <div className="text-sm text-sidebar-foreground/80 font-medium">Your Progress</div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 font-bold text-lg text-accent">
                <Flame className="w-5 h-5 fill-accent" />
                {user.streak} Day Streak
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              ₹{user.points} Earned
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} 
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                location === item.href 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 mt-auto">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header & Desktop Topbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b bg-white">
          <div className="flex items-center gap-4 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border text-sidebar-foreground">
                <div className="p-6">
                  <span className="flex items-center gap-2 text-2xl font-bold text-white tracking-tight">
                    <div className="bg-primary text-white p-1.5 rounded-lg">
                      <Trophy className="w-6 h-6" />
                    </div>
                    EduEarn
                  </span>
                </div>
                <nav className="px-4 py-2 space-y-1">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                        location === item.href 
                          ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-1.5 font-bold text-accent">
              <Flame className="w-5 h-5 fill-accent" />
              {user.streak}
            </div>
          </div>

          <div className="hidden md:flex items-center text-sm font-medium text-muted-foreground">
            Welcome back, <span className="text-foreground ml-1">{user.name}</span>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5 text-foreground/70" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-white" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-auto text-xs" onClick={() => markAllRead.mutate(undefined, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })})}>
                      Mark all read
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={cn("px-4 py-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors", !n.read && "bg-primary/5")}
                        onClick={() => {
                          if (!n.read) {
                            markNotificationRead.mutate({ id: n.id }, {
                              onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
                            });
                          }
                        }}
                      >
                        <div className="font-medium text-foreground mb-1 flex items-center justify-between">
                          {n.title}
                          {!n.read && <span className="w-2 h-2 bg-primary rounded-full" />}
                        </div>
                        <div className="text-muted-foreground text-xs leading-snug">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/profile">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 hover:bg-primary hover:text-white transition-colors cursor-pointer">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}