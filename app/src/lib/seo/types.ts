export type SiteSeo = {
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  meta_keywords: string | null;
  meta_keywords_list: string[];
  noindex: boolean;
  canonical_path: string;
};
