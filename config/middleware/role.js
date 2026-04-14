const roleMiddleware = (...roles) => {
  return (req, res, next) => {

    console.log("USER:", req.user);   // 🔍 debug
    console.log("ROLES:", roles);     // 🔍 debug

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

module.exports = roleMiddleware;

module.exports = roleMiddleware;