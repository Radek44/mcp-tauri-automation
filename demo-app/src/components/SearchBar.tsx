import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search recipes...' }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={`relative flex items-center transition-all ${
        isFocused ? 'ring-2 ring-primary-500' : ''
      } rounded-lg`}
    >
      <Search className="absolute left-3 text-gray-400" size={20} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="input-field pl-10 pr-10"
        data-testid="search-input"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
          data-testid="clear-search"
          aria-label="Clear search"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}
