import { Html2CanvasOptions } from "html2canvas";

declare module "html2canvas" {
  interface Html2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    backgroundColor?: string;
  }
}
