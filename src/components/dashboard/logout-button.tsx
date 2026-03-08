"use client";

import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      loading={isLoading}
      onClick={() => {
        void handleLogout();
      }}
      variant="danger"
    >
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
