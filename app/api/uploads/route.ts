import { NextResponse } from "next/server"
import { uploadDocuments } from "@/lib/operations"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const operationId = formData.get("operationId") as string
    const files = formData.getAll("files") as File[]

    if (!operationId) {
      return NextResponse.json({ error: "ID da operação não fornecido" }, { status: 400 })
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Criar um objeto FileList simulado para o upload
    const fileList = {
      length: files.length,
      item: (index: number) => files[index],
      [Symbol.iterator]: function* () {
        for (let i = 0; i < files.length; i++) {
          yield files[i]
        }
      },
    } as unknown as FileList

    const uploadedFiles = await uploadDocuments(fileList, operationId)

    return NextResponse.json({ files: uploadedFiles }, { status: 201 })
  } catch (error) {
    console.error("Erro ao fazer upload de arquivos:", error)
    return NextResponse.json({ error: "Erro ao fazer upload de arquivos" }, { status: 500 })
  }
}

