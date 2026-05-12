/**
 * Shared pagination helper.
 * Uses a single window.__paginationCallback so we never embed
 * a serialized function body in an onclick attribute.
 */
window.pagination = {

    render(containerId, meta, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container || !meta) return;

        // Store callback so inline onclick handlers can reach it
        window.__paginationCallback = onPageChange;

        const { pageNumber, totalPages, totalCount, pageSize } = meta;
        const start = totalCount > 0 ? (pageNumber - 1) * pageSize + 1 : 0;
        const end   = Math.min(pageNumber * pageSize, totalCount);

        // Build smart page-number list (always show first, last and ±1 of current)
        const rawPages = Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - pageNumber) <= 1);

        const pages = rawPages.reduce((acc, p, i, arr) => {
            if (i > 0 && arr[i - 1] !== p - 1) acc.push('ellipsis');
            acc.push(p);
            return acc;
        }, []);

        const pageButtons = pages.map(p => {
            if (p === 'ellipsis') {
                return '<span class="h-9 px-2 flex items-center text-slate-400 font-bold text-sm">\u2026</span>';
            }
            const active = p === pageNumber;
            return `<button
                        onclick="window.__paginationCallback(${p})"
                        class="h-9 w-9 text-sm font-bold rounded-lg border transition-all
                               ${active
                                   ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                   : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400'}"
                    >${p}</button>`;
        }).join('');

        const prevDisabled = pageNumber <= 1;
        const nextDisabled = pageNumber >= totalPages;

        container.innerHTML = `
            <div class="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50">
                <p class="text-sm text-slate-500 font-medium">
                    Showing
                    <span class="font-bold text-slate-800">${start}&ndash;${end}</span>
                    of
                    <span class="font-bold text-slate-800">${totalCount}</span>
                    results
                </p>
                <div class="flex items-center gap-2">
                    <button
                        onclick="window.__paginationCallback(${pageNumber - 1})"
                        ${prevDisabled ? 'disabled' : ''}
                        class="inline-flex items-center justify-center h-9 px-3 text-sm font-bold rounded-lg border transition-all
                               ${prevDisabled
                                   ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-white'
                                   : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400'}"
                    >
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                        Prev
                    </button>

                    ${pageButtons}

                    <button
                        onclick="window.__paginationCallback(${pageNumber + 1})"
                        ${nextDisabled ? 'disabled' : ''}
                        class="inline-flex items-center justify-center h-9 px-3 text-sm font-bold rounded-lg border transition-all
                               ${nextDisabled
                                   ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-white'
                                   : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400'}"
                    >
                        Next
                        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }
};
