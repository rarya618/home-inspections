import {
  collection, doc,
  getDocs, addDoc, deleteDoc, getDoc, updateDoc
} from "firebase/firestore";

import { db } from "./config";
import { Entry } from "../components/AddEntry";

const addEntry = async (data: {}) => {
  try {
    const docRef = await addDoc(collection(db, "data"), data);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

const getHouseEntries = async () => {
  let data: Entry[] = [];
  const querySnapshot = await getDocs(collection(db, "data"));

  querySnapshot.forEach((doc) => {
    // @ts-ignore
    data = [...data, {id: doc.id, ...doc.data()}]
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

export {addEntry, getHouseEntries, getEntry, deleteEntry, updateEntry}