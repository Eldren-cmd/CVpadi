import { LogoutButton } from "@/components/dashboard/logout-button";
import { formatKoboToNaira } from "@/lib/payments/constants";
import { REFERRAL_CREDIT_KOBO, buildReferralUrl } from "@/lib/referrals/constants";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/profile");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, referral_code, account_credit_kobo")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const referralUrl = profile?.referral_code ? buildReferralUrl(profile.referral_code) : "";

  return (
    <div className="grid gap-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--mid)]">Your account</p>
        <h1 className="mt-2 font-heading text-4xl text-[var(--cream)]">Profile</h1>
      </div>

      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--mid)]">Name</p>
        <p className="mt-1 text-sm text-[var(--cream)]">{profile?.full_name ?? "-"}</p>
      </div>

      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--mid)]">Email</p>
        <p className="mt-1 text-sm text-[var(--cream)]">{profile?.email ?? user.email ?? "-"}</p>
      </div>

      {profile?.account_credit_kobo && profile.account_credit_kobo > 0 ? (
        <div className="rounded-[16px] border border-[var(--green)] bg-[var(--green-glow)] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--green)]">Account credit</p>
          <p className="mt-1 text-sm text-[var(--cream)]">
            {formatKoboToNaira(profile.account_credit_kobo)} available
          </p>
        </div>
      ) : null}

      {referralUrl ? (
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--mid)]">Referral link</p>
          <p className="mt-2 break-all font-mono text-xs text-[var(--cream)]">{referralUrl}</p>
          <p className="mt-2 text-xs text-[var(--cream-dim)]">
            Share this link. When someone signs up and pays for their CV you earn {formatKoboToNaira(REFERRAL_CREDIT_KOBO)} credit.
          </p>
        </div>
      ) : null}

      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--mid)]">Account</p>
        <p className="mb-4 mt-1 text-sm text-[var(--cream-dim)]">Sign out of CVPadi on this device.</p>
        <LogoutButton />
      </div>
    </div>
  );
}
