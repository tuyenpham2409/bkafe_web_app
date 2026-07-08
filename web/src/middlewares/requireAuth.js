export function requireAuth(req, res, next) {
  if (!res.locals.currentUser) {
    const nextUrl = encodeURIComponent(req.originalUrl);
    return res.redirect(`/login?next=${nextUrl}&error=login_required`);
  }
  next();
}
