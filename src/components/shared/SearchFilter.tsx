import { Search } from 'lucide-react';

interface SearchFilterProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  categories: { value: string; label: string }[];
  placeholder?: string;
}

export function SearchFilter({ 
  search, 
  onSearchChange, 
  category, 
  onCategoryChange, 
  categories,
  placeholder = "Search..."
}: SearchFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text"
        />
      </div>
      {categories.length > 0 && (
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text min-w-[200px]"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
