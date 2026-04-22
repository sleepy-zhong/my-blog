const FULL_TAXONOMY_READ_ROLES = new Set(['admin', 'editor', 'author'])

function canReadFullTaxonomy(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : []
  return roles.some((role) => FULL_TAXONOMY_READ_ROLES.has(role))
}

module.exports = {
  canReadFullTaxonomy,
}
