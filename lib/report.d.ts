export type ReportData = Record<string, unknown>;
export function reportFileName(caseName: string, extension: "md" | "rtf"): string;
export function buildMarkdownReport(data: ReportData): string;
export function markdownToRtf(markdown: string): string;
export function buildRtfReport(data: ReportData): string;
