import "../src/app/globals.css";

import type { Preview } from "@storybook/nextjs-vite";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";

const mockRouter = {
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
};

const preview: Preview = {
  tags: ["autodocs"],

  decorators: [
    (Story) => {
      return (
        <AppRouterContext.Provider
          value={mockRouter as unknown as AppRouterInstance}
        >
          <style
            // biome-ignore lint/security/noDangerouslySetInnerHtml: safe injection
            dangerouslySetInnerHTML={{
              __html: `
            :root {
              --font-geist-sans: ${geistSans.style.fontFamily};
              --font-geist-mono: ${geistMono.style.fontFamily};
            }
            body {
              font-family: var(--font-geist-sans), sans-serif;
            }
          `,
            }}
          />
          <div className="font-sans antialiased">
            <Story />
          </div>
        </AppRouterContext.Provider>
      );
    },
  ],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
};

export default preview;
