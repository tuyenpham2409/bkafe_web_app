import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Fetch the CURRENT avatar (photoURL) for a set of user ids straight from the
 * `users` profiles. We look these up live instead of trusting the copy that was
 * denormalised onto a post/comment when it was created — that way, when a user
 * changes their avatar it is reflected on their old posts and comments too.
 */
export async function fetchPhotoURLs(uids: (string | undefined)[]): Promise<Record<string, string>> {
  const unique = [...new Set(uids.filter((u): u is string => !!u && u !== 'anonymous'))];
  const result: Record<string, string> = {};
  await Promise.all(
    unique.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        result[uid] = snap.exists() ? (snap.data().photoURL || '') : '';
      } catch {
        result[uid] = '';
      }
    })
  );
  return result;
}
