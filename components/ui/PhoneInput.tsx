import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { PHONE_PREFIXES } from "@/lib/countries";

interface PhoneInputProps {
  prefix: string;
  onPrefixChange: (val: string) => void;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function PhoneInput({ prefix, onPrefixChange, value, onChange, placeholder = "176 1234 5678" }: PhoneInputProps) {
  return (
    <div className="flex items-center h-11 rounded-full border border-gray-200 bg-white focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all overflow-visible">
      <div className="w-[70px] shrink-0 border-r border-gray-200 h-11">
        <SearchableSelect
          value={prefix}
          onChange={onPrefixChange}
          options={PHONE_PREFIXES.map(c => ({ id: c.code, name: `${c.code} ${c.name}`, description: c.flag }))}
          placeholder="+49"
          searchPlaceholder="Code or Country"
          className="w-full h-11 px-2 text-[14px] outline-none flex items-center justify-center font-medium bg-transparent rounded-l-full relative"
          dropdownClassName="left-0 min-w-[280px]"
          renderTrigger={(opt) => (
            <div className="flex items-center justify-center w-full h-full">
              <span>{opt ? `${opt.description} ${opt.id}` : "+49"}</span>
            </div>
          )}
        />
      </div>
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder={placeholder}
        className="flex-1 h-11 min-w-0 bg-transparent px-4 text-[14px] text-near-black outline-none placeholder:text-gray-400 rounded-r-full"
      />
    </div>
  );
}
