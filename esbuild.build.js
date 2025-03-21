import { readFile } from "node:fs/promises";
import tailwindcss from "@tailwindcss/postcss";
import * as esbuild from "esbuild";
import flowbiteReact from "flowbite-react/plugin/esbuild";
import postcss from "postcss";

const cssPlugin = {
  name: "css",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await readFile(args.path, "utf8");
      const result = await postcss([tailwindcss]).process(css, {
        from: args.path,
      });

      return {
        contents: result.css,
        loader: "css",
      };
    });
  },
};

await esbuild.build({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  minify: true,
  sourcemap: true,
  outdir: "dist",
  format: "esm",
  loader: {
    ".tsx": "tsx",
    ".ts": "tsx",
    ".jsx": "jsx",
    ".js": "jsx",
  },
  plugins: [cssPlugin, flowbiteReact()],
});
