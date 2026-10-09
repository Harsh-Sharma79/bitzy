import { createRouter, publicQuery } from "./middleware.js";

export const authRouter = createRouter({
  me: publicQuery.query(() => {
    return null;
  }),
  logout: publicQuery.mutation(() => {
    return { success: true };
  }),
});
