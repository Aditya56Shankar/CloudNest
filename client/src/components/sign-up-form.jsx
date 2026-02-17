import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Cloud, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import * as z from "zod";
import { signIn, signUp } from "../lib/queries";
import { useAuth } from "./auth-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

export default function SignUpForm() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const result = isSignUp ? await signUp(data) : await signIn(data);
      login(result.user, result.token);
      toast.success(`Successfully ${isSignUp ? "signed up" : "signed in"}`);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow">
              <Cloud size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CloudNest</span>
          </div>
          <div className="flex gap-4 text-sm text-gray-600">
            <a href="#" className="hover:text-blue-600">Learn more</a>
            <a href="#" className="hover:text-blue-600">Pricing</a>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Hero */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-gray-900">
              {isSignUp ? "Create your account" : "Welcome back 👋"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isSignUp ? "Start storing files securely" : "Sign in to continue"}
            </p>
          </div>

          {/* Glass Card */}
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white shadow-xl p-6 sm:p-8 transition-all">

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {isSignUp && (
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={18} />
                  <Input
                    {...form.register("name")}
                    placeholder="Your name"
                    className="pl-10 py-3 rounded-xl border-gray-200 bg-white/80 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={18} />
                <Input
                  type="email"
                  placeholder="Email address"
                  {...form.register("email")}
                  className="pl-10 py-3 rounded-xl border-gray-200 bg-white/80 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={18} />
                <Input
                  type="password"
                  placeholder="Password"
                  {...form.register("password")}
                  className="pl-10 py-3 rounded-xl border-gray-200 bg-white/80 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Loading...
                  </>
                ) : (
                  <>
                    {isSignUp ? "Create account" : "Sign in"}
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </form>

            {/* Toggle */}
            <p className="text-sm text-center text-gray-600 mt-6">
              {isSignUp ? "Already have an account?" : "New here?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 font-semibold hover:underline"
              >
                {isSignUp ? "Sign in" : "Create account"}
              </button>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-500">
            Privacy • Legal • Accessibility
          </p>
        </div>
      </div>
    </div>
  );
}
