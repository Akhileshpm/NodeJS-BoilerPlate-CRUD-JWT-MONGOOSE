const keys = {
    mongoURI: process.env.mongoURI,
    googleConfig: {
        clientID:process.env.googleClientID,
        clientSecret: process.env.googleClientSecret
    },
    jwtSecretKey: process.env.jwtSecretKey
};

export default keys;