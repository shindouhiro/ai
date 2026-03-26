import type { CustomRendererProps } from "streamdown";
import { CodeBlockContainer, CodeBlockHeader } from "streamdown";
import { useEffect, useRef, useState } from "react";

export const VegaLiteRenderer = ({
  code: sourceCode,
  language,
  isIncomplete,
}: CustomRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    if (isIncomplete || !containerRef.current) {
      return;
    }
    let cancelled = false;
    const render = async () => {
      try {
        setError(null);
        let spec;
        try {
          spec = JSON.parse(sourceCode);
        } catch (e: any) {
          throw new Error("Invalid JSON: " + e.message);
        }
        const vegaEmbed = (await import("vega-embed")).default;
        if (cancelled || !containerRef.current) {
          return;
        }
        containerRef.current.innerHTML = ""; // Clear previous
        await vegaEmbed(containerRef.current, spec, {
          actions: true,
          renderer: "svg",
        });
      } catch (err: any) {
        console.error("Vega render error", err);
        if (!cancelled) {
          setError(err.message || String(err));
        }
      }
    };
    render();
    return () => {
      cancelled = true;
    };
  }, [sourceCode, isIncomplete]);

  return (
    <CodeBlockContainer isIncomplete={isIncomplete} language={language}>
      <CodeBlockHeader language={language} />
      {isIncomplete ? (
        <div className="flex h-48 items-center justify-center rounded-md bg-muted">
          <span className="text-muted-foreground text-sm">
            Loading chart...
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md p-4 bg-white dark:bg-black/20">
          {error ? (
            <div className="text-red-500 text-sm font-mono whitespace-pre-wrap">{error}</div>
          ) : (
            <div ref={containerRef} className="w-full flex justify-center" />
          )}
        </div>
      )}
    </CodeBlockContainer>
  );
};
