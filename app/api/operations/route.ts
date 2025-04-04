import { NextResponse } from "next/server"
import { getOperations, getOperation, addOperation, updateOperation, deleteOperation } from "@/lib/operations"

// GET /api/operations - Listar todas as operações
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      // Buscar uma operação específica
      const operation = await getOperation(id)
      return NextResponse.json(operation)
    } else {
      // Listar todas as operações
      const operations = await getOperations()
      return NextResponse.json(operations)
    }
  } catch (error) {
    console.error("Erro ao buscar operações:", error)
    return NextResponse.json({ error: "Erro ao buscar operações" }, { status: 500 })
  }
}

// POST /api/operations - Criar uma nova operação
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const operation = await addOperation(data)
    return NextResponse.json(operation, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar operação:", error)
    return NextResponse.json({ error: "Erro ao criar operação" }, { status: 500 })
  }
}

// PUT /api/operations?id=123 - Atualizar uma operação
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID da operação não fornecido" }, { status: 400 })
    }

    const data = await request.json()
    const operation = await updateOperation(id, data)
    return NextResponse.json(operation)
  } catch (error) {
    console.error("Erro ao atualizar operação:", error)
    return NextResponse.json({ error: "Erro ao atualizar operação" }, { status: 500 })
  }
}

// DELETE /api/operations?id=123 - Excluir uma operação
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID da operação não fornecido" }, { status: 400 })
    }

    await deleteOperation(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir operação:", error)
    return NextResponse.json({ error: "Erro ao excluir operação" }, { status: 500 })
  }
}

