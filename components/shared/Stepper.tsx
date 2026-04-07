import { Check } from 'lucide-react';

interface Step {
 label: string;
 id?: number;
}

interface StepperProps {
 steps: Step[];
 currentStep: number;
 bgClass?: string;
 className?: string;
 onStepClick?: (step: number) => void;
}

export function Stepper({ steps, currentStep, bgClass = 'bg-gray-50', className = '', onStepClick }: StepperProps) {
 return (
 <div className={`py-8 mb-12 ${className}`}>
 <div className="flex items-center justify-between relative">
 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 z-0"></div>
 
 {steps.map((step, idx) => {
 const stepId = step.id || idx + 1;
 const isCompleted = currentStep > stepId;
 const isActive = currentStep === stepId;
 const isClickable = !!onStepClick && currentStep !== stepId;
 
 return (
 <div key={idx} className={`relative z-10 flex flex-col items-center px-4 ${bgClass}`}>
 <div 
 onClick={() => {
 if (isClickable) onStepClick(stepId);
 }}
 className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-[14px] transition-all
 ${isActive ? 'bg-[#008085] text-white ring-4 ring-[#008085]/20' : 
 isCompleted ? 'bg-[#008085] text-white' : 'bg-white border-2 border-gray-300 text-gray-400'}
 ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
 >
 {isCompleted ? <Check className="w-5 h-5" /> : stepId}
 </div>
 <span className={`mt-2 font-medium text-[13px] whitespace-nowrap ${isActive || isCompleted ? 'text-[#008085]' : 'text-gray-400'}`}>
 {step.label}
 </span>
 </div>
 );
 })}
 </div>
 
 {/* Active progress line connecting completed steps */}
 <div className="relative mt-[-44px] h-0.5 bg-transparent z-0 pointer-events-none">
 <div 
 className="h-full bg-[#008085] transition-colors duration-300"
 style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
 />
 </div>
 </div>
 );
}
