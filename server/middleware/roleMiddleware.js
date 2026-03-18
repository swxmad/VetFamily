const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Доступ запрещён. Требуется роль: ${roles.join(' или ')}`
      });
    }
    next();
  };
};

module.exports = { authorize };