// Pagination Component
// Creates a reusable pagination control

function createPagination(currentPage, totalPages, onPageChange) {
  if (totalPages <= 1) return '';
  
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  const paginationHTML = `
    <nav class="pagination" aria-label="${t('common.label.page')}" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 2rem;">
      <button 
        type="button"
        class="btn btn-secondary pagination__previous"
        style="padding: 0.5rem 0.75rem; ${currentPage === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
        onclick="changePage(${currentPage - 1})"
        ${currentPage === 1 ? 'disabled' : ''}
      >
        ‹ ${t('common.button.previous')}
      </button>
      
      ${startPage > 1 ? `
        <button type="button" class="btn btn-secondary pagination__page" style="padding: 0.5rem 0.75rem;" onclick="changePage(1)">1</button>
        ${startPage > 2 ? '<span class="pagination__ellipsis" style="color: #94a3b8;">...</span>' : ''}
      ` : ''}
      
      ${pages.map(page => `
        <button 
          type="button"
          class="btn ${page === currentPage ? 'btn-primary' : 'btn-secondary'} pagination__page"
          aria-current="${page === currentPage ? 'page' : 'false'}"
          style="padding: 0.5rem 0.75rem;"
          onclick="changePage(${page})"
        >
          ${page}
        </button>
      `).join('')}
      
      ${endPage < totalPages ? `
        ${endPage < totalPages - 1 ? '<span class="pagination__ellipsis" style="color: #94a3b8;">...</span>' : ''}
        <button type="button" class="btn btn-secondary pagination__page" style="padding: 0.5rem 0.75rem;" onclick="changePage(${totalPages})">${totalPages}</button>
      ` : ''}
      
      <button 
        type="button"
        class="btn btn-secondary pagination__next"
        style="padding: 0.5rem 0.75rem; ${currentPage === totalPages ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
        onclick="changePage(${currentPage + 1})"
        ${currentPage === totalPages ? 'disabled' : ''}
      >
        ${t('common.button.next')} ›
      </button>
    </nav>
    
    <div class="pagination__summary" style="text-align: center; margin-top: 1rem; color: #94a3b8; font-size: 0.875rem;">
      ${t('common.label.page')} ${currentPage} ${t('common.label.of')} ${totalPages}
    </div>
  `;
  
  return paginationHTML;
}
