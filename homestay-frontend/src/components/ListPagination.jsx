import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationDots,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  getPaginationItems
} from '../components/ui/pagination';

/**
 * Thanh phân trang dùng chung cho Admin / Host / User.
 */
const ListPagination = ({ page, totalPages, setPage, canPrevious, canNext }) => {
  if (!totalPages || totalPages < 1) return null;

  const paginationItems = getPaginationItems(page, totalPages);

  return (
    <div className="pagination-footer">
      <div className="pagination-stack">
        <Pagination>
          <PaginationContent>
            <PaginationPrevious
              disabled={!canPrevious}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            />

            {paginationItems.map((item, idx) => (
              item === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    isActive={item === page}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            ))}

            <PaginationNext
              disabled={!canNext}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </PaginationContent>
        </Pagination>

        {totalPages > 1 && totalPages <= 8 && (
          <PaginationDots
            page={page}
            totalPages={totalPages}
            onChange={setPage}
          />
        )}
      </div>
    </div>
  );
};

export default ListPagination;
