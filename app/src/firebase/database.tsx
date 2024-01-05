import {
  collection,
  getDoc, getDocFromServer, getDocs, query, where,
  addDoc
} from "firebase/firestore";

import { db } from "./config";
import { Entry } from "../components/Form";

const submitHouseData = async (data: {}) => {
  try {
    const docRef = await addDoc(collection(db, "data"), data);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

const getHouseData = async () => {
  let data: Entry[] = [];
  const querySnapshot = await getDocs(collection(db, "data"));

  querySnapshot.forEach((doc) => {
    // @ts-ignore
    data = [...data, {id: doc.id, ...doc.data()}]
  })

  return data;
}

export {submitHouseData, getHouseData}