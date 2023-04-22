import User from "../models/user";

export const googleLogin = async (req, res, next) => {
  if (!req.user) {
    return res.send(401, "User Not Authenticated");
  }
  const userEmail = req?.user?.emails?.length ? req.user.emails[0].value : "";
  const user = await User.findOne({ email: userEmail });

  if (!user) {
    return res.send(405, "User Not Allowed");
  }

  const token = await user.generateAuthToken();
  res.setHeader("x-auth-token", token);
  return res.send(200, "User logged in successfully");
};

