export type SampleDraft = Readonly<{
  title: string;
  network: "LinkedIn" | "Instagram";
  visibility: "private" | "shared";
}>;

// Fictional visual fixtures only; never seed this collection from user data.
export const sampleDrafts: readonly SampleDraft[] = [
  {
    title: "Autumn collection — launch story",
    network: "LinkedIn",
    visibility: "private",
  },
  {
    title: "A note on making room for good ideas",
    network: "Instagram",
    visibility: "shared",
  },
];
