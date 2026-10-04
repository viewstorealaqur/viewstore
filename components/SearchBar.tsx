"use client";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-wrap" role="search">
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>
      <span className="search-icon" aria-hidden="true">🔍</span>
      <input
        id="product-search"
        type="search"
        className="search-input"
        placeholder="Search products, models…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
        maxLength={100}
      />
      {value && (
        <button
          className="search-clear"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          ✕
        </button>
      )}
    </div>
  );
}
