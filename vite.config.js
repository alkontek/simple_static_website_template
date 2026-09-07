// SPDX-FileCopyrightText: 2026 ALKONTEK <git@alkontek.com>
// SPDX-License-Identifier: BSD-2-Clause

import {defineConfig} from 'vite'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {existsSync, readFileSync} from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const page = (...parts) => resolve(__dirname, 'pages', ...parts)

function htmlIncludes() {
    const includeRe = /<!--\s*include:(_?[a-z0-9_-]+\.html)\s*-->/gi

    function readPartial(fileName) {
        const file = resolve(__dirname, 'pages', fileName)
        if (!existsSync(file)) {
            throw new Error(`html-includes: missing pages/${fileName}`)
        }
        return readFileSync(file, 'utf8')
    }

    return {
        name: 'html-includes',
        transformIndexHtml: {
            order: 'pre',
            handler(html) {
                return html.replace(includeRe, (_, fileName) => readPartial(fileName))
            },
        },
        handleHotUpdate({file, server}) {
            const base = file.replace(/\\/g, '/').split('/').pop() ?? ''
            if (base.startsWith('_') && base.endsWith('.html')) {
                server.ws.send({type: 'full-reload'})
                return []
            }
        },
    }
}

export default defineConfig({
    // Project root contains the HTML entry points; `public/` holds static assets
    // (fonts, favicons, manifest) that are served from the site root as-is.
    root: '.',
    publicDir: 'public',
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
            },
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                index: page('index.html'),
                products: page('products.html'),
                research: page('research.html'),
                resources: page('resources.html'),
                contact: page('contact.html'),
                // nested
                // admin: page('admin', 'index.html'),
                // adminSettings: page('admin', 'settings.html'),
            },
        },
    },
    plugins: [
        htmlIncludes(),
        // Serve pages/* at site root in dev: /, /products.html, etc.
        {
            name: 'serve-pages-from-root',
            configureServer(server) {
                server.middlewares.use((req, _res, next) => {
                    const url = req.url?.split('?')[0] ?? ''
                    if (url === '/' || url === '/index.html') {
                        req.url = '/pages/index.html'
                    } else if (/^\/[a-z0-9-]+\.html$/i.test(url)) {
                        req.url = '/pages' + req.url
                    }
                    next()
                })
            },
        },
        // Emit built HTML at dist root instead of dist/pages/
        {
            name: 'flatten-pages-html',
            enforce: 'post',
            generateBundle(_options, bundle) {
                for (const output of Object.values(bundle)) {
                    if (
                        (output.type === 'asset' || output.type === 'chunk') &&
                        typeof output.fileName === 'string' &&
                        output.fileName.startsWith('pages/') &&
                        output.fileName.endsWith('.html')
                    ) {
                        output.fileName = output.fileName.slice('pages/'.length)
                    }
                }
            },
        },
        {
            name: 'remove-html-in-dev',
            transformIndexHtml(html, ctx) {
                // ctx.server exists only when running the dev server
                if (ctx.server) {
                    // Remove everything between the markers
                    return html.replace(
                        /<!--\s*PROD_ONLY_START\s*-->[\s\S]*?<!--\s*PROD_ONLY_END\s*-->/g,
                        ''
                    )
                }
                return html // keep it in production build
            },
        },
    ],
})
