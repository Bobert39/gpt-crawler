interface Config {
  url: string;
  match: string;
  selector: string;
  maxPagesToCrawl: number;
  outputFileName: string;
  maxTokens: number;
}

export const defaultConfig: Config = {
  url: "https://www.ifixit.com/Guide",
  match: "https://www.ifixit.com/Guide/**",
  selector: ".guide-content",  // Main content of guides
  maxPagesToCrawl: 1000,
  outputFileName: "ifixit-guides.json",
  maxTokens: 2000000,
};