declare module "nsfw-filter" {
  interface NSFWFilter {
    isSafe(file: File): Promise<boolean>;
    predictImg(
      file: File,
      guesses?: number,
    ): Promise<{ className: string; probability: number }[]>;
  }
  const filter: NSFWFilter;
  export default filter;
}
