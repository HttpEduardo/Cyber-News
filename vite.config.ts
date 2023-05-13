import { defineConfig } from "vite";
import PluginSolid from "vite-plugin-solid";

export default defineConfig({
    root: "src",
    plugins: [PluginSolid()],
    server: {
        port: 3000,
    },
    build: {
        target: "esnext",
        outDir: "../build"
    },
});
