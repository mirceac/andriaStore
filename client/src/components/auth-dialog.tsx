import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useAuth } from "@/lib/auth-context";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
  email: z.string().email("Invalid email address"),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

export function AuthDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const { login, signup } = useAuth();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
    },
  });

  async function onLoginSubmit(data: LoginForm) {
    try {
      await login(data.username, data.password);
      setIsOpen(false);
      loginForm.reset();
    } catch (error) {
      // Error handled by auth context
    }
  }

  async function onSignupSubmit(data: SignupForm) {
    try {
      await signup(data.username, data.password, data.email);
      setIsOpen(false);
      signupForm.reset();
    } catch (error) {
      // Error handled by auth context
    }
  }

  function switchMode(newMode: "login" | "signup") {
    setMode(newMode);
    loginForm.reset();
    signupForm.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Sign In</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "login" ? "Sign In" : "Create Account"}</DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Enter your credentials to sign in"
              : "Create a new account to get started"}
          </DialogDescription>
        </DialogHeader>

        {mode === "login" ? (
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Username</FormLabel>
              <Input
                type="text"
                {...loginForm.register("username")}
                placeholder="Enter username"
              />
              {loginForm.formState.errors.username && (
                <FormMessage>{loginForm.formState.errors.username.message}</FormMessage>
              )}
            </FormItem>
            <FormItem>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                {...loginForm.register("password")}
                placeholder="Enter password"
              />
              {loginForm.formState.errors.password && (
                <FormMessage>{loginForm.formState.errors.password.message}</FormMessage>
              )}
            </FormItem>
            <div className="flex flex-col gap-4">
              <Button type="submit">Sign In</Button>
              <Button
                type="button"
                variant="link"
                onClick={() => switchMode("signup")}
              >
                Don't have an account? Sign up
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Username</FormLabel>
              <Input
                type="text"
                {...signupForm.register("username")}
                placeholder="Enter username"
              />
              {signupForm.formState.errors.username && (
                <FormMessage>{signupForm.formState.errors.username.message}</FormMessage>
              )}
            </FormItem>
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                {...signupForm.register("email")}
                placeholder="Enter email"
              />
              {signupForm.formState.errors.email && (
                <FormMessage>{signupForm.formState.errors.email.message}</FormMessage>
              )}
            </FormItem>
            <FormItem>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                {...signupForm.register("password")}
                placeholder="Enter password"
              />
              {signupForm.formState.errors.password && (
                <FormMessage>{signupForm.formState.errors.password.message}</FormMessage>
              )}
            </FormItem>
            <div className="flex flex-col gap-4">
              <Button type="submit">Create Account</Button>
              <Button
                type="button"
                variant="link"
                onClick={() => switchMode("login")}
              >
                Already have an account? Sign in
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}