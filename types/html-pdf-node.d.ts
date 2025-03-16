declare module "html-pdf-node" {
  interface Options {
    format?: string;
    path?: string;
    width?: string | number;
    height?: string | number;
    printBackground?: boolean;
    margin?: {
      top?: string | number;
      right?: string | number;
      bottom?: string | number;
      left?: string | number;
    };
    preferCSSPageSize?: boolean;
    scale?: number;
    landscape?: boolean;
    displayHeaderFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
    pageRanges?: string;
  }

  interface File {
    content?: string;
    url?: string;
  }

  export function generatePdf(file: File, options: Options): Promise<Buffer>;
  export function generatePdfs(
    files: File[],
    options: Options
  ): Promise<Buffer[]>;
}
