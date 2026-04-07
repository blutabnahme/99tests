import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
 variant?: "pending" | "matched" | "booked" | "completed" | "cancelled" | "urgent" | "warning" | "info" | "success" | "error" | "default";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
 let variantClasses = "bg-[#F3F4F6] text-[#6E7280]"; // default Cancelled styling

 switch (variant) {
 case "pending":
 variantClasses = "bg-[#FEF0F2] text-[#008085]";
 break;
 case "matched":
 variantClasses = "bg-[#E6F5F5] text-[#008085]";
 break;
 case "booked":
 variantClasses = "bg-[#FFF7ED] text-[#D97706]";
 break;
 case "completed":
 case "success":
 variantClasses = "bg-[#F0FDF4] text-[#16A34A]";
 break;
 case "cancelled":
 variantClasses = "bg-[#F3F4F6] text-[#6E7280]";
 break;
 case "urgent":
 case "error":
 variantClasses = "bg-[#FEF0F2] text-[#008085]";
 break;
 case "warning":
 variantClasses = "bg-[#FFF7ED] text-[#D97706]";
 break;
 case "info":
 variantClasses = "bg-[#EFF6FF] text-[#2563EB]";
 break;
 }

 return (
 <span
 className={`inline-flex items-center rounded-[4px] px-[8px] py-[2px] text-[11px] font-body font-semibold transition-colors ${variantClasses} ${className || ""}`}
 {...props}
 />
 )
}

export { Badge }
