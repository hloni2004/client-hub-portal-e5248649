import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProductStore } from '@/stores/ecommerce/productStore';
import { Product } from '@/types/ecommerce';

export function SearchWithAutocomplete() {
  const navigate = useNavigate();
  const { searchSuggestions } = useProductStore();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get product image URL helper
  const getProductImageUrl = (product: Product) => {
    if (product.productImages && product.productImages.length > 0) {
      const primaryImage = product.productImages.find((img: any) => img.isPrimary) || product.productImages[0];
      return `http://localhost:8080/api/products/image/${primaryImage.imageId}`;
    }
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return '';
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  // Fetch suggestions when query changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        const results = await searchSuggestions(query);
        setSuggestions(results);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query, searchSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      setShowSuggestions(false);
      navigate(`/shop?search=${encodeURIComponent(query)}`);
      inputRef.current?.blur();
    }
  };

  const handleSelectSuggestion = (product: Product) => {
    setShowSuggestions(false);
    setQuery('');
    navigate(`/product/${product.id}`);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="pl-9 pr-9"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {suggestions.map((product, index) => (
            <button
              key={product.id}
              onClick={() => handleSelectSuggestion(product)}
              className={`w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left ${
                index === selectedIndex ? 'bg-muted' : ''
              }`}
            >
              {/* Product Image */}
              <div className="w-12 h-12 bg-muted rounded flex-shrink-0 overflow-hidden">
                {getProductImageUrl(product) ? (
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No Image
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(product.salePrice || product.basePrice)}
                </p>
              </div>
            </button>
          ))}

          {/* View All Results */}
          {suggestions.length > 0 && (
            <div className="border-t border-border p-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4 mr-2" />
                View all results for "{query}"
              </Button>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {showSuggestions && query.length >= 2 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 p-4 text-center text-muted-foreground text-sm">
          No products found for "{query}"
        </div>
      )}
    </div>
  );
}
