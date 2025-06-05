const authenticateSession = (req, res, next) => {
  if (req.session && req.session.user) {
    // Usuário autenticado via sessão
    next();
  } else {
    res.status(401).json({ error: 'Usuário não autenticado' });
  }
};

module.exports = authenticateSession;
