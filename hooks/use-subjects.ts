import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useSubjects() {
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "subjects"));
        const subjectList: { id: string; name: string }[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          subjectList.push({
            id: doc.id,
            name: data.name,
          });
        });
        setSubjects(subjectList.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  return { subjects, loading };
}
