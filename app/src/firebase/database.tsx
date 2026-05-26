import {
  collection, doc,
  getDocs, addDoc, deleteDoc, getDoc, updateDoc
} from "firebase/firestore";

import { db } from "./config";
import { Entry } from "../components/AddEntry";
import { calculateScore } from "../components/Score";
import { fetchTransitTimes, TransitTimes } from "../utils/maps";

const addEntry = async (data: {}) => {
  try {
    const docRef = await addDoc(collection(db, "data"), data);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

// Saves entry immediately, then fetches transit times in the background and patches them in
const addEntryWithTransit = async (data: Record<string, any>): Promise<void> => {
  const docRef = await addDoc(collection(db, "data"), data);
  fetchTransitTimes(data.address).then(times => {
    if (Object.keys(times).length > 0) {
      updateDoc(doc(db, "data", docRef.id), times as Record<string, any>);
    }
  });
};

const refreshTransitTimes = async (entryId: string, address: string): Promise<TransitTimes> => {
  const times = await fetchTransitTimes(address);
  if (Object.keys(times).length > 0) {
    await updateDoc(doc(db, "data", entryId), times as Record<string, any>);
  }
  return times;
};

const getHouseEntries = async () => {
  let data: Entry[] = [];
  const querySnapshot = await getDocs(collection(db, "data"));

  querySnapshot.forEach((doc) => {
    let tempEntry = {id: doc.id, ...doc.data()};
    // @ts-ignore
    data = [...data, {...tempEntry, score: calculateScore(tempEntry)}]
  })

  return data;
}

const getEntry = async (currentEntry: string) => {
  const snapshot = await getDoc(doc(db, "data", currentEntry))
  let tempData = {id: snapshot.id, ...snapshot.data()}
  console.log(tempData)
  return tempData
}

const deleteEntry = async (id: string) => {
  await deleteDoc(doc(db, "data", id));
} 

const updateEntry = async (entryId: string, data: {}) => {
  try {
    await updateDoc(doc(db, "data", entryId), data);
    console.log("Document updated with ID: ", entryId);
  } catch (e) {
    console.error("Error updating document: ", e);
  }
}

export {addEntry, addEntryWithTransit, refreshTransitTimes, getHouseEntries, getEntry, deleteEntry, updateEntry}