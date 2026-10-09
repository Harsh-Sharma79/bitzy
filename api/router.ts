import { createRouter } from "./middleware.js";
import { authRouter } from "./auth-router.js";
import { gamificationRouter } from "./gamification-router.js";
import { mentorRouter } from "./mentor-router.js";
import { courseRouter } from "./course-router.js";
import { challengeRouter } from "./challenge-router.js";
import { adminRouter } from "./admin-router.js";
import { paymentRouter } from "./payment-router.js";

export const appRouter = createRouter({
  auth: authRouter,
  gamification: gamificationRouter,
  mentor: mentorRouter,
  course: courseRouter,
  challenge: challengeRouter,
  admin: adminRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
