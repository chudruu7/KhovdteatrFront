import { copyFile, cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const frontRoot = path.resolve(here, '..');
const mobileRoot = path.join(frontRoot, 'cinema-mobile');
const mobileOut = path.join(frontRoot, 'public', 'mobile');
const mobileOutFromMobile = path.relative(mobileRoot, mobileOut);
const publicMobileFonts = path.join(frontRoot, 'public', 'mobile-fonts');

const result = spawnSync(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['exec', 'expo', 'export', '--', '--platform', 'web', '--output-dir', mobileOutFromMobile, '--clear'],
  { cwd: mobileRoot, stdio: 'inherit', shell: process.platform === 'win32' }
);

if (result.status !== 0) {
  if (result.error) console.error(result.error);
  process.exit(result.status ?? 1);
}

const indexPath = path.join(mobileOut, 'index.html');
let html = await readFile(indexPath, 'utf8');
const fontsDir = path.join(mobileOut, 'assets', 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts');
const publicFontBase = '/mobile-fonts';
const fontFiles = await readdir(fontsDir);
const iconFontCss = fontFiles
  .filter((name) => name.endsWith('.ttf'))
  .map((name) => {
    const family = name.split('.')[0];
    return `@font-face{font-family:'${family}';src:url('${publicFontBase}/${name}') format('truetype');font-weight:normal;font-style:normal;font-display:block;}`;
  })
  .join('');

if (!html.includes("window.history.replaceState(null, '', '/')")) {
  html = html.replace(
    '<body>',
    `<body>
    <script>
      if (window.location.pathname.startsWith('/mobile')) {
        window.__CINEMA_MOBILE_PUBLIC_PATH__ = '/mobile';
        window.history.replaceState(null, '', '/' + window.location.search + window.location.hash);
      }
    </script>`
  );
}

if (!html.includes('data-cinema-mobile-icon-fonts')) {
  html = html.replace(
    '</head>',
    `    <style data-cinema-mobile-icon-fonts>${iconFontCss}</style>\n  </head>`
  );
}

await writeFile(indexPath, html);

const webBundleDir = path.join(mobileOut, '_expo', 'static', 'js', 'web');
const webBundleFiles = (await readdir(webBundleDir)).filter((name) => name.endsWith('.js'));
for (const file of webBundleFiles) {
  const filePath = path.join(webBundleDir, file);
  const source = await readFile(filePath, 'utf8');
  const patched = source.replaceAll(
    '/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/',
    '/mobile-fonts/'
  );
  if (patched !== source) {
    await writeFile(filePath, patched);
  }
}

await mkdir(path.join(frontRoot, 'public', '_expo'), { recursive: true });
await mkdir(path.join(frontRoot, 'public', 'assets'), { recursive: true });
await mkdir(publicMobileFonts, { recursive: true });
await cp(path.join(mobileOut, '_expo'), path.join(frontRoot, 'public', '_expo'), { recursive: true, force: true });
await cp(path.join(mobileOut, 'assets'), path.join(frontRoot, 'public', 'assets'), { recursive: true, force: true });
await cp(fontsDir, publicMobileFonts, { recursive: true, force: true });

try {
  await copyFile(path.join(mobileOut, 'metadata.json'), path.join(frontRoot, 'public', 'mobile-metadata.json'));
} catch {
  // Optional Expo metadata is not required for serving the app.
}
