


export function commentsSignature(comments) {
  return (comments || [])
    .map((c) => `${c.id}:${c.updatedAt}:${c.ratingCount}:${c.ratingAvg}`)
    .join('|');
}
