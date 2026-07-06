// Turn Mongoose docs (possibly populated / lean) into the JSON shape the clients expect.

function ratingOf(ratings, userId) {
  if (!ratings || !userId) return null;
  const key = String(userId);
  if (typeof ratings.get === 'function') return ratings.get(key) ?? null; // Map
  return ratings[key] ?? null; // plain object (from .lean())
}

export function shapePost(post, user) {
  const a = post.author && post.author._id ? post.author : null;
  return {
    id: String(post._id),
    title: post.title,
    content: post.content,
    topic: post.topic,
    media: post.media || [],
    status: post.status,
    rejectReason: post.rejectReason || '',
    views: post.views || 0,
    shares: post.shares || 0,
    ratingAvg: post.ratingAvg || 0,
    ratingCount: post.ratingCount || 0,
    myRating: ratingOf(post.ratings, user?._id),
    authorId: a ? String(a._id) : null,
    authorName: a ? a.displayName : 'Người dùng',
    authorPhotoURL: a ? a.photoURL || '' : '',
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export function shapeComment(comment, user) {
  const a = comment.author && comment.author._id ? comment.author : null;
  return {
    id: String(comment._id),
    postId: String(comment.post),
    parentId: comment.parent ? String(comment.parent) : null,
    content: comment.content,
    authorId: a ? String(a._id) : null,
    authorName: comment.authorName || (a ? a.displayName : 'Người dùng'),
    authorEmail: comment.authorEmail || '',
    authorPhotoURL: a ? a.photoURL || '' : '',
    ratingAvg: comment.ratingAvg || 0,
    ratingCount: comment.ratingCount || 0,
    myRating: ratingOf(comment.ratings, user?._id),
    createdAt: comment.createdAt,
  };
}
