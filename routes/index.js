import auth from "./auth";
import resource from "./resource";
import healthCheck from "./healthCheck";

const routes = (app, passport) => {
  app.use("/status", healthCheck);
  app.use("/auth",
  passport.authenticate("google-token", { session: false }),
  auth);
  app.use("/resources",
  passport.authenticate("jwt", { session: false }),  
  resource);
};

export default routes;
