

function ratingOf(ratings, userId) {
  if (!ratings || !userId) return null;
  const key = String(userId);
  const val = typeof ratings.get === 'function' ? ratings.get(key) : ratings[key];
  return (val === 0 || val === undefined || val === null) ? null : val;
}

export function shapePost(post, user) {
  const a = post.author && post.author._id ? post.author : null;
  
  
  const ratingsMap = post.ratings;
  const ratingValues = [];
  if (ratingsMap) {
    const entries = typeof ratingsMap.values === 'function'
      ? Array.from(ratingsMap.values())
      : Object.values(ratingsMap);
    for (const v of entries) {
      const num = Number(v);
      if (v !== null && v !== undefined && !isNaN(num) && num !== 0) {
        ratingValues.push(num);
      }
    }
  }
  const ratingCount = ratingValues.length;
  const ratingAvg = ratingCount > 0 ? ratingValues.reduce((sum, val) => sum + val, 0) / ratingCount : 0;

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
    ratingAvg,
    ratingCount,
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
  
  
  const ratingsMap = comment.ratings;
  const ratingValues = [];
  if (ratingsMap) {
    const entries = typeof ratingsMap.values === 'function'
      ? Array.from(ratingsMap.values())
      : Object.values(ratingsMap);
    for (const v of entries) {
      const num = Number(v);
      if (v !== null && v !== undefined && !isNaN(num) && num !== 0) {
        ratingValues.push(num);
      }
    }
  }
  const ratingCount = ratingValues.length;
  const ratingAvg = ratingCount > 0 ? ratingValues.reduce((sum, val) => sum + val, 0) / ratingCount : 0;

  return {
    id: String(comment._id),
    postId: String(comment.post),
    parentId: comment.parent ? String(comment.parent) : null,
    content: comment.content,
    media: comment.media || [],
    authorId: a ? String(a._id) : null,
    authorName: comment.authorName || (a ? a.displayName : 'Người dùng'),
    authorEmail: comment.authorEmail || '',
    authorPhotoURL: a ? a.photoURL || '' : '',
    ratingAvg,
    ratingCount,
    myRating: ratingOf(comment.ratings, user?._id),
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

