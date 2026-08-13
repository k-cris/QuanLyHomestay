import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * shadcn/ui-style Pagination primitives.
 * Visible page numbers are 1-based; callers convert to 0-based offsets elsewhere (once).
 */

export function Pagination({ className = '', ...props }) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={`pagination ${className}`.trim()}
      {...props}
    />
  );
}

export function PaginationContent({ className = '', ...props }) {
  return (
    <ul className={`pagination-content ${className}`.trim()} {...props} />
  );
}

export function PaginationItem({ className = '', ...props }) {
  return <li className={`pagination-item ${className}`.trim()} {...props} />;
}

export function PaginationLink({
  className = '',
  isActive = false,
  disabled = false,
  children,
  onClick,
  ...props
}) {
  return (
    <button
      type="button"
      className={`pagination-link${isActive ? ' is-active' : ''}${disabled ? ' is-disabled' : ''} ${className}`.trim()}
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export function PaginationPrevious({ disabled, onClick, className = '', ...props }) {
  return (
    <PaginationItem>
      <PaginationLink
        className={`pagination-prev ${className}`.trim()}
        aria-label="Go to previous page"
        disabled={disabled}
        onClick={onClick}
        {...props}
      >
        <ChevronLeft size={18} strokeWidth={2.25} />
      </PaginationLink>
    </PaginationItem>
  );
}

export function PaginationNext({ disabled, onClick, className = '', ...props }) {
  return (
    <PaginationItem>
      <PaginationLink
        className={`pagination-next ${className}`.trim()}
        aria-label="Go to next page"
        disabled={disabled}
        onClick={onClick}
        {...props}
      >
        <ChevronRight size={18} strokeWidth={2.25} />
      </PaginationLink>
    </PaginationItem>
  );
}

export function PaginationEllipsis({ className = '', ...props }) {
  return (
    <span
      className={`pagination-ellipsis ${className}`.trim()}
      aria-hidden="true"
      {...props}
    >
      …
      <span className="sr-only">More pages</span>
    </span>
  );
}

/** Dots page control (UIPageControl-style), complementary to numbered pagination */
export function PaginationDots({ page, totalPages, onChange }) {
  const total = Math.max(1, totalPages);
  return (
    <div className="pagination-dots" role="group" aria-label="Page control">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const active = n === page;
        return (
          <button
            key={n}
            type="button"
            className={`pagination-dot${active ? ' is-active' : ''}`}
            aria-label={`Go to page ${n}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(n)}
          />
        );
      })}
    </div>
  );
}

/**
 * Build a compact page window with ellipsis gaps.
 * Example (page 5 of 12): [1, 'ellipsis', 4, 5, 6, 'ellipsis', 12]
 */
export function getPaginationItems(currentPage, totalPages, siblingCount = 1) {
  const total = Math.max(1, totalPages);
  const current = Math.min(Math.max(1, currentPage), total);

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items = [];
  const left = Math.max(2, current - siblingCount);
  const right = Math.min(total - 1, current + siblingCount);

  items.push(1);

  if (left > 2) {
    items.push('ellipsis');
  } else {
    for (let p = 2; p < left; p += 1) items.push(p);
  }

  for (let p = left; p <= right; p += 1) items.push(p);

  if (right < total - 1) {
    items.push('ellipsis');
  } else {
    for (let p = right + 1; p < total; p += 1) items.push(p);
  }

  items.push(total);
  return items;
}
