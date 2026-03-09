import { create } from "zustand";

export type PostPrivacy = "ANYONE" | "FOLLOWED" | "MENTIONED";

interface PostState {
  postPrivacy: PostPrivacy;
  setPostPrivacy: (privacy: PostPrivacy) => void;
}

const usePost = create<PostState>((set) => ({
  postPrivacy: "ANYONE",
  setPostPrivacy: (privacy) => set({ postPrivacy: privacy }),
}));

export default usePost;
