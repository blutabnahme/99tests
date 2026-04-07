import * as React from "react"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
 padding?: "none" | "compact" | "default" | "spacious";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
 ({ className, padding = "default", ...props }, ref) => {
 let paddingClass = "p-[20px]";
 if (padding === "compact") paddingClass = "p-[16px]";
 if (padding === "spacious") paddingClass = "p-[24px]";
 if (padding === "none") paddingClass = "p-0";

 return (
 <div
 ref={ref}
 className={`rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm hover:shadow-md transition-shadow ${paddingClass} ${className || ""}`}
 {...props}
 />
 )
 }
)
Card.displayName = "Card"

export { Card }
