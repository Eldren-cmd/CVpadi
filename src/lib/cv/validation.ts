import { z } from "zod";
import { DISPOSABLE_DOMAINS } from "./constants";

export const nigerianPhoneRegex = /^(?:\+234|0)(7|8|9)\d{9}$/;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long."),
});

export const magicLinkSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export function isDisposableEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.includes(domain) : false;
}

export function isAtLeast13(dateOfBirth: string) {
  if (!dateOfBirth) {
    return false;
  }

  const birthDate = new Date(dateOfBirth);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 13);
  return birthDate <= cutoff;
}
