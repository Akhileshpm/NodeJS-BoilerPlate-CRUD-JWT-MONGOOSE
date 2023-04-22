import auth from "./auth";
import dashboard from "./dashboard";
import resource from "./resource";
import project from "./project";
import stream from "./stream";
import healthCheck from "./healthCheck";
import sampleData from "./sampleData";
import role from "./role";
import bulkUpload from "./bulkUpload";

const routes = (app, passport) => {
  app.use("/status", healthCheck);
  app.use("/auth",
  passport.authenticate("google-token", { session: false }),
  auth);
  app.use("/dashboard",
  passport.authenticate("jwt", { session: false }),  
  dashboard);
  app.use("/resources",
  passport.authenticate("jwt", { session: false }),  
  resource);
  app.use("/projects",
  passport.authenticate("jwt", { session: false }),  
  project);
  app.use("/streams",
  passport.authenticate("jwt", { session: false }),  
  stream);
  app.use("/role",
  passport.authenticate("jwt", { session: false }),  
  role);
  app.use("/uploads",
  passport.authenticate("jwt", { session: false }),  
  bulkUpload);
};

export default routes;
