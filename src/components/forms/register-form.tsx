"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Icons } from "@/components/icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function RegisterForm() {
  const router = useRouter();
  type Inputs = z.infer<typeof registerSchema>;

  const [isPending, startTransition] = React.useTransition();

  const form = useForm<Inputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
  });

  function onSubmit(data: Inputs) {
    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email: data.email,
          username: data.username,
          password: data.password,
          mode: "register",
          redirect: false,
        });

        if (result?.ok) {
          router.push("/account?origin=/");
          router.refresh();
        } else {
          toast.error(
            result?.error || "Registration failed. Please try again.",
          );
        }
      } catch (err) {
        console.error("Registration error:", err);
        toast.error("Something went wrong, please try again later.");
      }
    });
  }

  return (
    <Form {...form}>
      <form
        className="w-full flex flex-col py-4 gap-1.5 text-start"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field, formState }) => (
            <FormItem>
              <FormControl>
                <Input
                  className={cn(
                    "h-14 rounded-xl bg-[#1e1e1e] border-none focus-visible:ring-1 focus-visible:ring-[#393939] text-white",
                    formState.errors.email && "focus-visible:ring-red-700",
                  )}
                  placeholder="Email"
                  type="email"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field, formState }) => (
            <FormItem>
              <FormControl>
                <Input
                  className={cn(
                    "h-14 rounded-xl bg-[#1e1e1e] border-none focus-visible:ring-1 focus-visible:ring-[#393939] text-white",
                    formState.errors.username && "focus-visible:ring-red-700",
                  )}
                  placeholder="Username"
                  type="text"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field, formState }) => (
            <FormItem>
              <FormControl>
                <Input
                  className={cn(
                    "h-14 rounded-xl bg-[#1e1e1e] border-none focus-visible:ring-1 focus-visible:ring-[#393939] text-white",
                    formState.errors.password && "focus-visible:ring-red-700",
                  )}
                  placeholder="Password"
                  type="password"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isPending}
          className="h-14 rounded-xl my-1 font-semibold bg-white hover:bg-white text-black w-full"
        >
          {isPending ? <Icons.loading className="h-10 w-10" /> : "Sign up"}
        </Button>
      </form>
    </Form>
  );
}
