"use client";

import { useRouter } from "next/navigation";

export function ClickableRow({ 
  id, 
  children, 
  className 
}: { 
  id: string, 
  children: React.ReactNode, 
  className?: string 
}) {
  const router = useRouter();
  return (
    <tr 
      onClick={() => router.push(`/dashboard/recommendations/${id}`)} 
      className={`cursor-pointer group ${className}`}
    >
      {children}
    </tr>
  );
}
