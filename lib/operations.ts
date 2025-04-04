import { db, storage } from "./firebaseConfig"
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

// Tipo para a operação
export interface Operation {
  id?: string
  number: string
  client: string
  value: number
  status: string
  personType: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  clientDocument: string
  clientSalary: number
  profession: string
  professionalActivity: string
  propertyType: string
  propertyValue: number
  propertyLocation: string
  desiredValue: number
  incomeProof: string
  creditDefense: string
  documents: string[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// Referência à coleção de operações
const operationsCollection = collection(db, "operations")

// Gerar número de operação único
export const generateOperationNumber = async () => {
  const snapshot = await getDocs(operationsCollection)
  const count = snapshot.size + 1
  return `OP${count.toString().padStart(3, "0")}`
}

// Obter todas as operações
export const getOperations = async () => {
  const snapshot = await getDocs(query(operationsCollection, orderBy("createdAt", "desc")))
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Operation[]
}

// Filtrar operações por status
export const getOperationsByStatus = async (status: string) => {
  const q = query(operationsCollection, where("status", "==", status), orderBy("createdAt", "desc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Operation[]
}

// Buscar operações por termo
export const searchOperations = async (term: string) => {
  // No Firestore, não podemos fazer busca de texto completo facilmente
  // Então vamos buscar todas as operações e filtrar no cliente
  const snapshot = await getDocs(operationsCollection)
  const operations = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Operation[]

  return operations.filter(
    (op) =>
      op.number.toLowerCase().includes(term.toLowerCase()) ||
      op.client.toLowerCase().includes(term.toLowerCase()) ||
      op.clientName.toLowerCase().includes(term.toLowerCase()),
  )
}

// Obter uma operação específica
export const getOperation = async (id: string) => {
  const docRef = doc(db, "operations", id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Operation
  } else {
    throw new Error("Operação não encontrada")
  }
}

// Adicionar uma nova operação
export const addOperation = async (operation: Omit<Operation, "id" | "createdAt" | "updatedAt">) => {
  const now = Timestamp.now()
  const newOperation = {
    ...operation,
    createdAt: now,
    updatedAt: now,
  }

  const docRef = await addDoc(operationsCollection, newOperation)
  return {
    id: docRef.id,
    ...newOperation,
  }
}

// Atualizar uma operação existente
export const updateOperation = async (id: string, operation: Partial<Operation>) => {
  const operationRef = doc(db, "operations", id)
  const updatedOperation = {
    ...operation,
    updatedAt: Timestamp.now(),
  }

  await updateDoc(operationRef, updatedOperation)
  return {
    id,
    ...updatedOperation,
  }
}

// Excluir uma operação
export const deleteOperation = async (id: string) => {
  const operationRef = doc(db, "operations", id)
  await deleteDoc(operationRef)
  return id
}

// Upload de documentos
export const uploadDocument = async (file: File, operationId: string) => {
  const storageRef = ref(storage, `operations/${operationId}/${file.name}`)
  await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(storageRef)
  return {
    name: file.name,
    url: downloadURL,
  }
}

// Upload de múltiplos documentos
export const uploadDocuments = async (files: FileList, operationId: string) => {
  const uploadPromises = Array.from(files).map((file) => uploadDocument(file, operationId))
  return Promise.all(uploadPromises)
}

