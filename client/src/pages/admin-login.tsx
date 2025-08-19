import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Shield, LogIn } from "lucide-react";
import { loginRequestSchema, type LoginRequest } from "@shared/schema";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login, isLoggingIn, loginError, isAuthenticated } = useAdminAuth();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already authenticated - but don't interfere with login process
  useEffect(() => {
    if (isAuthenticated && !isLoggingIn) {
      setLocation("/admin");
    }
  }, [isAuthenticated, isLoggingIn, setLocation]);

  const onSubmit = (data: LoginRequest) => {
    login(data);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center border-b border-gray-100">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-medium text-gray-800">Innlogging</h1>
          <p className="text-gray-600">Logg inn for å få tilgang</p>
        </CardHeader>
        
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brukernavn</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Skriv inn brukernavn"
                        {...field}
                        disabled={isLoggingIn}
                      />
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
                    <FormLabel>Passord</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Skriv inn passord"
                        {...field}
                        disabled={isLoggingIn}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">
                    {(loginError as any)?.message || "Innlogging mislyktes. Kontroller brukernavn og passord."}
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-dark text-white py-3"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Logger inn...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LogIn className="h-4 w-4" />
                    <span>Logg inn</span>
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <a href="#" className="text-xs text-gray-500 hover:text-primary transition-colors">Support</a>
            </div>
            <p className="text-xs text-gray-400">
              © TL 2025
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}