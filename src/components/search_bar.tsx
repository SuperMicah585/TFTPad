import { Search } from "lucide-react";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search...", className = "" }: SearchBarProps) {
    return (
        <div className={`relative ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:border-transparent"
                onFocus={(e) => {
                    e.target.style.borderColor = 'rgb(253, 186, 116)';
                    e.target.style.boxShadow = '0 0 0 2px rgb(253, 186, 116)';
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db'; // gray-300
                    e.target.style.boxShadow = 'none';
                }}
            />
        </div>
    );
} 