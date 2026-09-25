"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdminLoginFormSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(1, { message: "A senha é obrigatória" }),
});

type AdminLoginFormValues = z.infer<typeof AdminLoginFormSchema>;

interface AdminLoginFormProps {
  onSubmit?: (data: AdminLoginFormValues) => void;
}

export function AdminLoginForm({ onSubmit }: AdminLoginFormProps) {
  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(AdminLoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((data) => onSubmit?.(data))}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@example.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Sua senha"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full">
        Login
      </Button>
    </form>
  );
}
