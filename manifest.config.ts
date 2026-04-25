import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: "Linki",
  description: pkg.description,
  version: pkg.version,
  icons: {
    16: "public/icons/icon-16.png",
    32: "public/icons/icon-32.png",
    48: "public/icons/icon-48.png",
    128: "public/icons/icon-128.png",
  },
  action: {
    default_popup: "src/popup/index.html",
    default_title: "Linki",
    default_icon: {
      16: "public/icons/icon-16.png",
      32: "public/icons/icon-32.png",
      48: "public/icons/icon-48.png",
    },
  },
  permissions: ["tabs"],
});
