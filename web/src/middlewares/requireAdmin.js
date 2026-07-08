export function requireAdmin(req, res, next) {
  if (!res.locals.currentUser || res.locals.currentUser.role !== 'admin') {
    return res.redirect('/?error=admin_required');
  }
  next();
}
