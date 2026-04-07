import * as React from "react"

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
 required?: boolean;
 hint?: React.ReactNode;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
 ({ className, children, required, hint, ...props }, ref) => (
 <label
 ref={ref}
 className={`block text-[13px] font-semibold text-near-black mb-1.5 ${className || ""}`}
 {...props}
 >
 {children}
 {required && <span className="text-primary ml-1">*</span>}
 {hint && <span className="font-normal text-gray-500 ml-1.5 text-[12px]">{hint}</span>}
 </label>
 )
)
Label.displayName = "Label"

export { Label }
