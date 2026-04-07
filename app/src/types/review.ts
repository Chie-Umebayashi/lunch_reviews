export type Review = {
  id: number;
  name: string;
  comment: string;
  lat: number;
  lng: number;
  likes: number;
  /** data URL (data:image/...) or null */
  imageUrl: string | null;
};
