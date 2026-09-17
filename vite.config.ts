import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Groups a module id under a short package/app label for the inventory report.
function getModuleGroup(id: string): string {
  if (id.includes('node_modules')) {
    const match = id.replace(/\\/g, '/').match(/node_modules\/(\.pnpm\/)?(@[^/]+\/[^/]+|[^/]+)/);
    return match ? match[2].replace(/^@n20a\//, '@n20a/') : 'node_modules/other';
  }
  const appMatch = id.replace(/\\/g, '/').match(/\/serviceportal\/([^/]+)/);
  return appMatch ? `src/${appMatch[1]}` : 'app/other';
}

// Emits dist/chunk-inventory.json: for every output chunk, its size and the
// modules it contains (grouped by package), so oversized chunks can be reorganized.
function chunkInventoryPlugin(): Plugin {
  return {
    name: 'chunk-inventory',
    generateBundle(_options, bundle) {
      const report: Record<string, unknown> = {};

      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type !== 'chunk') continue;

        const groupSizes: Record<string, number> = {};
        for (const [modId, modInfo] of Object.entries(item.modules)) {
          const group = getModuleGroup(modId);
          groupSizes[group] = (groupSizes[group] || 0) + (modInfo.renderedLength || 0);
        }

        const topContributors = Object.entries(groupSizes)
          .sort((a, b) => b[1] - a[1])
          .map(([group, bytes]) => ({ group, bytes }));

        report[fileName] = {
          name: item.name,
          isEntry: item.isEntry,
          isDynamicEntry: item.isDynamicEntry,
          sizeBytes: Buffer.byteLength(item.code, 'utf8'),
          imports: item.imports,
          dynamicImports: item.dynamicImports,
          moduleCount: Object.keys(item.modules).length,
          topContributors,
        };
      }

      this.emitFile({
        type: 'asset',
        fileName: 'chunk-inventory.json',
        source: JSON.stringify(report, null, 2),
      });
    },
  };
}

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        open: true,
    },
    build: {
        minify: 'esbuild',
        // Emits dist/.vite/manifest.json mapping entries to their output chunks.
        manifest: true,
        rollupOptions: {
            plugins: [chunkInventoryPlugin()],
            output: {
                manualChunks(id) {
                    // Only chunk vendor modules to avoid circular dependencies.
                    // Let Vite handle React and app code chunking automatically.

                    if (id.includes('node_modules')) {
                        // Let Vite handle React, ReactDOM, and scheduler automatically.
                        // Manually chunking React causes circular dependencies with MUI.

                        // 1. AG Grid (large grid library)
                        if (id.includes('ag-grid')) {
                            return 'vendor-aggrid';
                        }

                        // 2. Heavy utilities (lazy loaded via dynamic import in app code)
                        if (id.includes('xlsx')) {
                            return 'vendor-xlsx';
                        }

                        // 3. PDF/canvas export utilities
                        if (id.includes('html2canvas') || id.includes('jspdf')) {
                            return 'vendor-pdf';
                        }

                        // 4. @n20a libs isolated as their own vendor chunks (each is large
                        // enough on its own, and none of them depend back on vendor-core).
                        if (id.includes('@n20a/libcountry')) {
                            return 'vendor-libcountry';
                        }
                        if (id.includes('@n20a/libcart')) {
                            return 'vendor-libcart';
                        }
                        if (id.includes('@n20a/libflippdf')) {
                            return 'vendor-libflippdf';
                        }
                        if (id.includes('@n20a/libform')) {
                            return 'vendor-libform';
                        }

                        // 5. Core UI stack + remaining smaller @n20a libraries + standalone
                        // third-party utilities, all merged into a single chunk. These groups
                        // cross-depend on each other in both directions (e.g. some @n20a libs
                        // render MUI/PrimeReact components, while MUI/PrimeReact pull in axios
                        // and other small utilities) — keeping them in one chunk avoids a
                        // circular chunk reference and cuts down on small requests.
                        // react-router + MUI/Emotion + PrimeReact + libicon + libauth +
                        // libavnotes + libaxios + libalerts + libmiscfn + libfsdb +
                        // libmcpclient + liblayout + markdown-it + lodash + axios + dompurify +
                        // file-saver + html-react-parser + styled-components + rc-tree +
                        // react-zoom-pan-pinch
                        if (
                            id.includes('react-router') ||
                            id.includes('@mui') ||
                            id.includes('@emotion') ||
                            id.includes('primereact') ||
                            id.includes('@n20a/') ||
                            id.includes('markdown-it') ||
                            id.includes('lodash') ||
                            id.includes('axios') ||
                            id.includes('dompurify') ||
                            id.includes('purify.es') ||
                            id.includes('file-saver') ||
                            id.includes('html-react-parser') ||
                            id.includes('styled-components') ||
                            id.includes('rc-tree') ||
                            id.includes('react-zoom-pan-pinch')
                        ) {
                            return 'vendor-core';
                        }

                        // 6. Let Vite handle other node_modules (react, react-dom, scheduler,
                        // etc.) automatically to avoid circular dependencies.
                        // Don't use a catch-all return here.
                    }

                    // Let Vite handle all app code chunking automatically.
                    // This preserves the existing lazy-loaded feature boundaries (React.lazy /
                    // dynamic import) and avoids circular dependencies between app-* chunks
                    // that naive folder-based manual chunking previously introduced
                    // (e.g. feature-services-common <-> feature-services-devicemodel).
                },
                // Asset file naming pattern (CSS is combined into a single file due to cssCodeSplit: false)
                assetFileNames: 'assets/[name]-[hash][extname]',
            },
            onwarn: (warning, warn) => {
                // Suppress "use client" directive warnings from RSC-aware libraries (MUI, PrimeReact, react-router)
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('"use client"')) return;
                warn(warning);
            },
        },
        // vendor-libcountry alone is ~8.5 MB (bundled country/reference data) — raise the
        // warning threshold so only genuinely unexpected large chunks get flagged.
        chunkSizeWarningLimit: 9000,
        // Combine all CSS into a single file to reduce network requests (most CSS chunks are small)
        cssCodeSplit: false,
        // Enable source maps for better debugging (disable in production if needed)
        sourcemap: false,
        // Target modern browsers for smaller bundles
        target: 'es2020',
        // Optimize chunk size
        cssMinify: false,
        // Configure module preload for critical chunks.
        // This generates <link rel="modulepreload"> tags to load chunks in parallel.
        modulePreload: {
            polyfill: true,
            resolveDependencies: (_filename, deps) => {
                // Always preload vendor-core (react-router + MUI + PrimeReact),
                // needed by most pages, while browser parses the main chunk in parallel.
                return deps.filter((dep) => dep.includes('vendor-core'));
            },
        },
    },
});
