import { Strategy as GoogleTokenStrategy } from "passport-google-token";
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import config from "../config";

const passportStrategy = (passport) => {
  passport.use(
    new GoogleTokenStrategy(
      config.googleConfig,
      (accessToken, refreshToken, profile, done) => done(null, profile)
    )
  );

  passport.use(
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.jwtSecretKey,
      },
      (jwtPayload, done) => {
        done(null, jwtPayload);
      }
    )
  );
};

export default passportStrategy;
