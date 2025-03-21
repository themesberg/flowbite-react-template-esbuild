import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import tailwindcss from "@tailwindcss/postcss";
import * as esbuild from "esbuild";
import flowbiteReact from "flowbite-react/plugin/esbuild";
import postcss from "postcss";

const clients = new Set();

const cssPlugin = {
  name: "css",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await readFile(args.path, "utf8");
      const result = await postcss([tailwindcss]).process(css, {
        from: args.path,
        map: { inline: true },
      });

      return {
        contents: result.css,
        loader: "css",
      };
    });
  },
};

const buildOptions = {
  entryPoints: ["src/main.tsx"],
  bundle: true,
  outdir: "dist",
  sourcemap: true,
  format: "esm",
  loader: {
    ".tsx": "tsx",
    ".ts": "tsx",
    ".jsx": "jsx",
    ".js": "jsx",
    ".svg": "dataurl",
  },
  plugins: [
    cssPlugin,
    flowbiteReact(),
    {
      name: "live-reload",
      setup(build) {
        build.onEnd(() => {
          clients.forEach((client) => client.write("data: update\n\n"));
        });
      },
    },
  ],
};

const ctx = await esbuild.context(buildOptions);
await ctx.watch();

// Initial build
await ctx.rebuild();

// Simple HTTP server
createServer(async (req, res) => {
  const { url } = req;

  if (url === "/esbuild") {
    return clients.add(
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      }),
    );
  }

  try {
    let path = url === "/" ? "/index.html" : url;
    const filePath = path.startsWith("/dist") ? path.slice(1) : `.${path}`;

    const content = await readFile(filePath);
    const ext = path.split(".").pop();

    const contentTypes = {
      html: "text/html",
      js: "text/javascript",
      css: "text/css",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      svg: "image/svg+xml",
    };

    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "text/plain",
    });
    res.end(content);
  } catch (e) {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(3000);

console.log("Development server running on http://localhost:3000");
