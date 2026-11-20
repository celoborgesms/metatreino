# como montar o fit-parser.min.js
npm install fit-file-parser@6.2.10 esbuild
npx esbuild entry.js --bundle --minify --format=iife --platform=browser --target=es2018 --define:global=window --inject:./shim.js --outfile=fit-parser.min.js
