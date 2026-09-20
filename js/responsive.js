/* Q1KEY shared responsive runtime. */
(function responsiveRuntime(global) {
  'use strict';

  const CARD_TABLE_SELECTOR = 'table.table, table.data-table, table.plans-table';
  const SCROLL_TABLE_SELECTOR = 'table.report-table';

  function getHeaderLabels(table) {
    const headerRow = table.tHead && table.tHead.rows && table.tHead.rows[0];
    if (!headerRow) return [];
    return Array.from(headerRow.cells, (cell) => (cell.textContent || '').trim());
  }

  function labelRows(table) {
    const labels = getHeaderLabels(table);
    if (!labels.length) return;

    Array.from(table.tBodies || []).forEach((body) => {
      Array.from(body.rows).forEach((row) => {
        const cells = Array.from(row.cells);
        if (cells.length === 1 && cells[0].hasAttribute('colspan')) {
          row.classList.add('responsive-table-message');
          return;
        }

        row.classList.remove('responsive-table-message');
        cells.forEach((cell, index) => {
          if (!cell.hasAttribute('data-label') && labels[index]) {
            cell.setAttribute('data-label', labels[index]);
          }
        });
      });
    });
  }

  function observeTable(table) {
    if (table.dataset.responsiveObserved === 'true') return;
    table.dataset.responsiveObserved = 'true';

    let timer;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => labelRows(table), 40);
    });

    Array.from(table.tBodies || []).forEach((body) => {
      observer.observe(body, { childList: true, subtree: true });
    });
  }

  function enhanceTables(root) {
    const scope = root && root.querySelectorAll ? root : document;

    scope.querySelectorAll(CARD_TABLE_SELECTOR).forEach((table) => {
      table.classList.add('responsive-data-table');
      labelRows(table);
      observeTable(table);
    });

    scope.querySelectorAll(SCROLL_TABLE_SELECTOR).forEach((table) => {
      table.classList.add('responsive-scroll-table');
    });
  }

  function markPage() {
    if (!document.body) return;
    const filename = global.location.pathname.split('/').pop() || 'index.html';
    const pageName = filename.replace(/\.html?$/i, '').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    document.body.classList.add('app-page', `${pageName || 'index'}-page`);
    document.body.dataset.page = pageName || 'index';
  }

  function init() {
    markPage();
    enhanceTables(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  global.enhanceResponsiveLayout = function enhanceResponsiveLayout(root) {
    markPage();
    enhanceTables(root || document);
  };
})(window);
