// A compact fingerprint of the comments feed so the client can tell — with a
// single string compare — whether anything visible changed (new/edited/deleted
// comment or a rating change) and only then swap the rendered feed in.
export function commentsSignature(comments) {
  return (comments || [])
    .map((c) => `${c.id}:${c.updatedAt}:${c.ratingCount}:${c.ratingAvg}`)
    .join('|');
}
