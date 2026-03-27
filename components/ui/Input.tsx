import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefixNode?: React.ReactNode;
  suffixNode?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, prefixNode, suffixNode, ...props }, ref) => {
    return (
      <div className="flex items-center w-full">
        {prefixNode && (
          <span className="px-4 py-2 bg-gray-50 border border-[#D4D4D4] border-r-0 rounded-l-full text-[14px] text-gray-500 font-semibold flex items-center h-[42px]">
            {prefixNode}
          </span>
        )}
        <input
          type={type}
          className={`flex-1 w-full min-w-0 px-4 py-2 h-[42px] bg-white border border-[#D4D4D4] text-[14px] font-body text-near-black placeholder-[#9CA3AF] outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${
            prefixNode && suffixNode ? "rounded-none" : prefixNode ? "rounded-r-full" : suffixNode ? "rounded-l-full" : "rounded-full"
          } ${className || ""}`}
          ref={ref}
          {...props}
        />
        {suffixNode && (
          <span className="px-4 py-2 bg-gray-50 border border-[#D4D4D4] border-l-0 rounded-r-full text-[14px] text-gray-500 font-medium flex items-center h-[42px]">
            {suffixNode}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
