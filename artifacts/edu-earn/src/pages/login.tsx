import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { useLogin, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Trophy, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading: isUserLoading } = useGetMe({ 
    query: { 
      queryKey: getGetMeQueryKey(),
      retry: false
    } 
  });

  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  if (isUserLoading) return null;

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/dashboard");
      },
      onError: (error) => {
        form.setError("root", { 
          message: error.error || "Failed to login. Please check your credentials." 
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-6 left-6 text-slate-500 hover:text-slate-900 flex items-center gap-2 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back home
      </Link>
      
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary text-white p-2 rounded-xl shadow-sm mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
          <p className="text-slate-500 mt-1">Ready to earn some points?</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} className="h-12 bg-slate-50/50 border-slate-200" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="h-12 bg-slate-50/50 border-slate-200" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.formState.errors.root && (
              <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg">
                {form.formState.errors.root.message}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold mt-2" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center text-slate-500">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary font-bold hover:underline">
            Get started
          </Link>
        </div>
      </div>
    </div>
  );
}