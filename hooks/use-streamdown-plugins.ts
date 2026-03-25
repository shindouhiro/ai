import { useMemo } from 'react';
import { createCodePlugin } from "@streamdown/code";
import { createMermaidPlugin } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";
import { VegaLiteRenderer } from "../components/vega-lite-renderer";

export function useStreamdownPlugins(resolvedTheme: string | undefined) {
  return useMemo(() => {
    return {
      code: createCodePlugin(),
      renderers: [
        { language: ["vega-lite", "vega", "vegalite"], component: VegaLiteRenderer },
      ],
      mermaid: createMermaidPlugin({
        config: {
          theme: resolvedTheme === 'dark' ? 'dark' : 'default',
        }
      }),
      math,
      cjk,
    };
  }, [resolvedTheme]);
}
