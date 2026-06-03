import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MyanmarDateInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  buttonClassName?: string;
}

const formatDateToDisplay = (dateInput: string | Date) => {
  if (!dateInput) return 'dd-mm-yyyy';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'dd-mm-yyyy';
  
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-');
    return `${day}-${month}-${year}`;
  }
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const MyanmarDateInput: React.FC<MyanmarDateInputProps> = ({
  value,
  onChange,
  required = false,
  className,
  buttonClassName
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        try {
          inputRef.current.showPicker();
        } catch (e) {
          inputRef.current.click();
        }
      } else {
        inputRef.current.click();
      }
    }
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <input
        ref={inputRef}
        type="date"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none cursor-pointer"
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={handleButtonClick}
        className={cn(
          "w-full text-left pl-3 pr-8 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-[10px] font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-between",
          buttonClassName
        )}
      >
        <span>{value ? formatDateToDisplay(value) : 'dd-mm-yyyy'}</span>
        <Calendar size={12} className="text-zinc-400 shrink-0 ml-1.5" />
      </button>
    </div>
  );
};
