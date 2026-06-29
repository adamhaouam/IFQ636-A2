import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

import { Button, Input } from "@otbt/ui";

import {
  currentCustomerQueryKey,
  invalidateCustomerSessionQueries,
  useLoginCustomerMutation,
} from "../customer-auth.query";
import { setSessionToken } from "../customer-auth.storage";

type LoginFormState = {
  email: string;
  password: string;
};

const initialLoginFormState: LoginFormState = {
  email: "",
  password: "",
};

export function LoginForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loginCustomerMutation = useLoginCustomerMutation();
  const [formState, setFormState] = useState(initialLoginFormState);

  function updateFormField(field: keyof LoginFormState, value: string) {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await loginCustomerMutation.mutateAsync(formState);
      setSessionToken(response.token);
      queryClient.setQueryData(currentCustomerQueryKey, {
        customer: response.customer,
      });
      await invalidateCustomerSessionQueries(queryClient);
      navigate("/");
    } catch {
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          Email
        </label>
        <Input
          autoComplete="email"
          id="email"
          name="email"
          onChange={(event) => updateFormField("email", event.target.value)}
          required
          type="email"
          value={formState.email}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="password">
          Password
        </label>
        <Input
          autoComplete="current-password"
          id="password"
          name="password"
          onChange={(event) => updateFormField("password", event.target.value)}
          required
          type="password"
          value={formState.password}
        />
      </div>

      {loginCustomerMutation.isError ? (
        <p className="text-sm text-destructive">
          {loginCustomerMutation.error.message}
        </p>
      ) : null}

      <Button
        className="w-full"
        disabled={loginCustomerMutation.isPending}
        type="submit"
      >
        {loginCustomerMutation.isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
