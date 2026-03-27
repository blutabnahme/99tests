import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "success" | "danger" | "bc-primary" | "bc-secondary" | "bc-outline" | "bc-solid";
  size?: "sm" | "default" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", asChild = false, ...props }, ref) => {
    
    let variantClasses = "";
    switch (variant) {
      case "primary":
        variantClasses = "bg-primary text-white border border-transparent hover:bg-primary-dark shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:-translate-y-[1px]";
        break;
      case "secondary":
        variantClasses = "bg-transparent text-primary border-[1.5px] border-primary hover:bg-primary hover:text-white";
        break;
      case "ghost":
        variantClasses = "bg-transparent text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-near-black";
        break;
      case "bc-primary":
        variantClasses = "bg-primary text-white border border-transparent hover:bg-primary-dark shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:-translate-y-[1px]";
        break;
      case "bc-outline":
        variantClasses = "bg-transparent text-primary border-[1.5px] border-primary hover:bg-primary hover:text-white";
        break;
      case "bc-solid":
        variantClasses = "bg-primary text-white border border-transparent hover:brightness-95";
        break;
      case "bc-secondary":
        variantClasses = "bg-transparent text-primary border-[1.5px] border-primary hover:bg-primary hover:text-white";
        break;
      case "success":
        variantClasses = "bg-primary text-white border border-transparent hover:brightness-95";
        break;
      case "danger":
        variantClasses = "bg-red-600 text-white border border-transparent hover:bg-red-700";
        break;
    }

    let sizeClasses = "";
    switch (size) {
      case "sm":
        sizeClasses = "px-[14px] py-[4px] text-[11px]";
        break;
      case "default":
        sizeClasses = "px-[20px] py-[8px] text-[13px]";
        break;
      case "lg":
        sizeClasses = "px-[28px] py-[12px] text-[15px]";
        break;
    }

    return (
      <button
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-full font-body font-semibold transition-all duration-200 disabled:!bg-gray-100 disabled:!text-gray-400 disabled:!border-transparent disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed ${variantClasses} ${sizeClasses} ${className || ""}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
