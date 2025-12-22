import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useNavigate } from "react-router";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useAuth } from "./auth-context";
import { signIn, signUp } from "../lib/queries";
import { Cloud, ArrowRight, Mail, Lock, User } from "lucide-react";

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
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header - Always Visible at all zoom levels */}
      <div className="border-b border-gray-200 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Cloud size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap truncate">CloudNest</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            <a href="#" className="text-xs sm:text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap text-center">
              Learn more
            </a>
            <a href="#" className="text-xs sm:text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap text-center">
              Pricing
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
        <div className="w-full max-w-md sm:max-w-lg">
          {/* Hero Section */}
          <div className="mb-6 sm:mb-8 text-center px-2 sm:px-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">
              {isSignUp ? "Create your account" : "Sign in to CloudNest"}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">
              {isSignUp
                ? "Get started with your cloud storage today"
                : "Access your files from anywhere"}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              {/* Name Field (Sign Up Only) */}
              {isSignUp && (
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 flex-shrink-0">
                    <User size={16} className="sm:w-5 sm:h-5" />
                  </div>
                  <Input
                    id="name"
                    placeholder="Your name"
                    {...form.register("name")}
                    className="pl-9 sm:pl-10 w-full rounded-lg border border-gray-300 bg-gray-50 py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Email Field */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 flex-shrink-0">
                  <Mail size={16} className="sm:w-5 sm:h-5" />
                </div>
                <Input
                  id="email"
                  type="email"
                  // placeholder="Email address"
                  {...form.register("email")}
                  className="pl-9 sm:pl-10 w-full rounded-lg border border-gray-300 bg-gray-50 py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 flex-shrink-0">
                  <Lock size={16} className="sm:w-5 sm:h-5" />
                </div>
                <Input
                  id="password"
                  type="password"
                  // placeholder="Password"
                  {...form.register("password")}
                  className="pl-9 sm:pl-10 w-full rounded-lg border border-gray-300 bg-gray-50 py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 sm:mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></span>
                    <span className="text-xs sm:text-sm">Loading...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs sm:text-sm">{isSignUp ? "Create account" : "Sign in"}</span>
                    <ArrowRight size={16} className="flex-shrink-0" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-4 sm:my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">or</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Toggle Auth Mode */}
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 sm:mt-12 grid grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2 flex-shrink-0">
                <Cloud size={20} className="sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              </div>
              <p className="text-xs text-gray-600 leading-tight">Secure storage</p>
            </div>
            <div className="text-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2 flex-shrink-0">
                <Cloud size={20} className="sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              </div>
              <p className="text-xs text-gray-600 leading-tight">Easy access</p>
            </div>
            <div className="text-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2 flex-shrink-0">
                <Cloud size={20} className="sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              </div>
              <p className="text-xs text-gray-600 leading-tight">Share files</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 text-center text-xs text-gray-500 space-y-1">
            <p className="flex flex-wrap justify-center gap-1 sm:gap-2">
              <a href="#" className="hover:text-gray-700">
                Privacy & Cookies
              </a>
              <span>•</span>
              <a href="#" className="hover:text-gray-700">
                Legal
              </a>
              <span>•</span>
              <a href="#" className="hover:text-gray-700">
                Accessibility
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
