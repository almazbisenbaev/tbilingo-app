import { db } from '@/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface LevelMeta {
  title: string;
  description: string;
}

export function useLevelMeta(courseId: string): LevelMeta {
  const [meta, setMeta] = useState<LevelMeta>({ title: '', description: '' });

  useEffect(() => {
    if (!courseId) return;

    const fetchMeta = async () => {
      try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (courseSnap.exists()) {
          const data = courseSnap.data();
          setMeta({
            title: data.title ?? '',
            description: data.description ?? '',
          });
        }
      } catch (err) {
        console.error('Error fetching level meta:', err);
      }
    };

    fetchMeta();
  }, [courseId]);

  return meta;
}
