const OktaJwtVerifier = require("@okta/jwt-verifier");

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.ISSUER,
  clientId: process.env.CLIENT_ID,
});

module.exports = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization)
      return res.send({
        message: "You must send an Authorization header",
      });
    //   throw new Error("You must send an Authorization header");

    const [authType, token] = authorization.trim().split(" ");
    if (authType !== "Bearer")
      return res.send({
        message: "Expected a Bearer token",
      });
    //   throw new Error("Expected a Bearer token");

    const { claims } = await oktaJwtVerifier.verifyAccessToken(
      token,
      "api://default"
    );
    if (!claims.scp.includes(process.env.SCOPE)) {
      return res.send({
        message: "Could not verify the proper scope",
      });
      //   throw new Error("Could not verify the proper scope");
    }
    next();
  } catch (error) {
    next(
      res.send({
        message: error.message,
      })
    );
  }
};
