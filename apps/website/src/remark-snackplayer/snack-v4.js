const visit = require("unist-util-visit-parents");
const u = require("unist-builder");
const dedent = require("dedent");

const processNodeV4 = (node, parent) => {
  return new Promise(async (resolve, reject) => {
    try {
      const params = Object.fromEntries(new URLSearchParams(node.meta));

      // Gather necessary Params
      const name = params.name ? decodeURIComponent(params.name) : "Example";
      const description = params.description
        ? decodeURIComponent(params.description)
        : "Example usage";
      const sampleCode = node.value;

      const platform = params.platform || "web";
      const supportedPlatforms = params.supportedPlatforms || "ios,android,web";
      const theme = params.theme || "light";
      const preview = params.preview || "true";
      const loading = params.loading || "eager";
      const dependencies =
        params.dependencies || "react,react-native,nativewind@2.0.11";

      const appCode = `import React from 'react';
import { View, Text, Pressable } from "./expo-snack"

${sampleCode}

export default App;`;

      const snackJS = `import { createElement } from "react";
import { StyleSheet } from "nativewind"
import { unstable_styled } from "react-native-css-interop"
import {
  Platform,
  Text as RNText,
  View as RNView,
  Pressable as RNPressable,
} from "react-native";


/**
  * 🗣️ Do as I say 📝, not as I do 🚫🤷‍♂️.
  * 
  * Expo Snack does not allow setting the JSX runtime to automatic, or running a custom server.
  * Therefore these demos utilise undocumented & unstable APIs that should not be used!
  * 
  * These examples are for demonstrative purposes only. They have known bugs/issues and are not
  * representative of NativeWind.
  * 
  * Please do not use these APIs in your own projects.
  */
const render = (element, { children, ...props }, key) => {
  return createElement(element, { key, ...props }, ...children)
}

export const View = unstable_styled(RNView, render);
export const Text = unstable_styled(RNText, render);
export const Pressable = unstable_styled(RNPressable, render);

if (Platform.OS === "web") {
  var tailwindScript = document.createElement('script');
  tailwindScript.setAttribute('src','https://cdn.tailwindcss.com');
  document.head.appendChild(tailwindScript);
} else {
  StyleSheet.unstable_hook_onClassName = (className) => {
    fetch(\`\${globalThis.window.location.origin}/api/compile?classNames=\${classNames.join(" ")}\`)
      .then((response) => response.json())
      .then(({ body }) => {
        StyleSheet.register(body);
      })
      .catch((error) => {
        console.error(error);
      });
  }
}`;

      const files = JSON.stringify({
        "App.tsx": {
          type: "CODE",
          contents: appCode,
        },
        "expo-snack.ts": {
          type: "CODE",
          contents: snackJS,
        },
      });

      // Generate Node for SnackPlayer
      // See https://github.com/expo/snack/blob/main/docs/embedding-snacks.md
      const snackPlayerDiv = u("html", {
        value: `<div
  class="snack-player"
  data-snack-name="${name}"
  data-snack-description="${description}"
  data-snack-dependencies="${dependencies}"
  data-snack-platform="${platform}"
  data-snack-supported-platforms="${supportedPlatforms}"
  data-snack-theme="${theme}"
  data-snack-preview="${preview}"
  data-snack-loading="${loading}"
  data-snack-sdkversion="49.0.0"
  data-snack-files="${encodeURIComponent(files)}"
/>`,
      });

      // Replace code block with SnackPlayer Node
      const index = parent[0].children.indexOf(node);
      parent[0].children.splice(index, 1, snackPlayerDiv);
    } catch (e) {
      return reject(e);
    }
    resolve();
  });
};

module.exports = { processNodeV4 };