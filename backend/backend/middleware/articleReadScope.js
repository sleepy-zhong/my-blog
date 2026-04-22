const ALLOWED_STATUSES = new Set(['draft', 'published', 'archived']);

function hasPrivilegedArticleReadRole(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  return roles.includes('admin') || roles.includes('editor');
}

module.exports = function (req, _res, next) {
  const requestedStatus = typeof req.query.status === 'string'
    ? req.query.status.trim().toLowerCase()
    : '';

  if (!hasPrivilegedArticleReadRole(req.user)) {
    req.query.status = 'published';
    return next();
  }

  if (requestedStatus && ALLOWED_STATUSES.has(requestedStatus)) {
    req.query.status = requestedStatus;
  }

  next();
};
