const authenticateSession = (req, res, next) => {
  if (req.session && req.session.user) {
    // Adiciona o ID do usuário ao req.user para compatibilidade
    req.user = { id: req.session.user.id };
    next();
  } else {
    res.status(401).json({ error: 'Usuário não autenticado' });
  }
};

module.exports = authenticateSession;
