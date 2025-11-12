/**
 * Keystone - Virtualized List Component
 *
 * High-performance list rendering with react-window
 * Handles 10,000+ items with minimal performance impact
 *
 * Features:
 * - Window/virtual scrolling
 * - Dynamic item heights
 * - Search/filter support
 * - Keyboard navigation
 * - Accessibility
 */

"use client";

import { memo, useCallback, useMemo, useState, useRef, useEffect } from "react";
import { List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

// Type for list child props
interface ListChildComponentProps {
  index: number;
  style: React.CSSProperties;
  data?: any;
}

export interface VirtualizedListItem {
  id: string | number;
  [key: string]: any;
}

export interface VirtualizedListProps<T extends VirtualizedListItem> {
  /**
   * Items to render
   */
  items: T[];

  /**
   * Render function for each item
   */
  renderItem: (item: T, index: number) => React.ReactNode;

  /**
   * Height of each item in pixels
   */
  itemHeight?: number;

  /**
   * Enable search/filter
   */
  searchable?: boolean;

  /**
   * Search placeholder
   */
  searchPlaceholder?: string;

  /**
   * Filter function
   */
  filterFn?: (item: T, query: string) => boolean;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Empty state message
   */
  emptyMessage?: string;

  /**
   * Class name for container
   */
  className?: string;

  /**
   * Callback when item is clicked
   */
  onItemClick?: (item: T, index: number) => void;

  /**
   * Overscan count (number of items to render outside visible area)
   */
  overscanCount?: number;
}

/**
 * Virtualized List Component
 */
export function VirtualizedList<T extends VirtualizedListItem>({
  items,
  renderItem,
  itemHeight = 50,
  searchable = false,
  searchPlaceholder = "Search...",
  filterFn,
  loading = false,
  emptyMessage = "No items found",
  className = "",
  onItemClick,
  overscanCount = 5,
}: VirtualizedListProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const listRef = useRef<any>(null);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    if (filterFn) {
      return items.filter((item) => filterFn(item, searchQuery));
    }

    // Default filter: search in all string properties
    return items.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      return Object.values(item).some((value) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchLower);
        }
        return false;
      });
    });
  }, [items, searchQuery, filterFn]);

  // Render row component
  const Row = useCallback(
    ({ index, style, ariaAttributes }: { index: number; style: React.CSSProperties; ariaAttributes: any }) => {
      const item = filteredItems[index];

      return (
        <div
          style={style}
          className="virtualized-list-item"
          onClick={() => onItemClick?.(item, index)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onItemClick?.(item, index);
            }
          }}
          {...ariaAttributes}
        >
          {renderItem(item, index)}
        </div>
      );
    },
    [filteredItems, renderItem, onItemClick]
  );

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Reset scroll position when searching
    listRef.current?.scrollToItem(0);
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    listRef.current?.scrollToItem(0);
  }, []);

  if (loading) {
    return (
      <div className={`virtualized-list ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className={`virtualized-list ${className}`}>
      {searchable && (
        <div className="virtualized-list-search mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search items"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredItems.length} of {items.length} items
            </p>
          )}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500">{emptyMessage}</div>
      ) : (
        <div className="virtualized-list-container" style={{ height: "100%", minHeight: 400 }}>
          <AutoSizer>
            {({ height, width }) => (
              <List
                listRef={listRef}
                rowComponent={Row as any}
                rowCount={filteredItems.length}
                rowHeight={itemHeight}
                rowProps={{} as any}
                style={{ height, width }}
                overscanCount={overscanCount}
              />
            )}
          </AutoSizer>
        </div>
      )}
    </div>
  );
}

/**
 * Memoized version for better performance
 */
export const MemoizedVirtualizedList = memo(VirtualizedList) as typeof VirtualizedList;

/**
 * Hook for virtualized list state management
 */
export function useVirtualizedList<T extends VirtualizedListItem>(
  items: T[],
  options?: {
    defaultSearchQuery?: string;
    searchFields?: (keyof T)[];
  }
) {
  const [searchQuery, setSearchQuery] = useState(options?.defaultSearchQuery || "");
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const searchLower = searchQuery.toLowerCase();

    return items.filter((item) => {
      if (options?.searchFields) {
        return options.searchFields.some((field) => {
          const value = item[field];
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchLower);
          }
          return false;
        });
      }

      // Default: search all string fields
      return Object.values(item).some((value) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchLower);
        }
        return false;
      });
    });
  }, [items, searchQuery, options?.searchFields]);

  const toggleItem = useCallback((id: string | number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(filteredItems.map((item) => item.id)));
  }, [filteredItems]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filteredItems,
    selectedItems,
    toggleItem,
    selectAll,
    clearSelection,
    isSelected: (id: string | number) => selectedItems.has(id),
    selectedCount: selectedItems.size,
  };
}
