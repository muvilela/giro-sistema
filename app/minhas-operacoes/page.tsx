"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Bell, Search, PlusCircle, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

// Importando funções do Firebase
import {
  getOperations,
  getOperationsByStatus,
  searchOperations,
  addOperation,
  getOperation,
  updateOperation,
  uploadDocuments,
  generateOperationNumber,
  type Operation,
} from "@/lib/operations"

export default function MinhasOperacoesPage() {
  const [operations, setOperations] = useState<Operation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    personType: "fisica",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    clientDocument: "",
    clientSalary: "",
    profession: "",
    professionalActivity: "",
    propertyType: "",
    propertyValue: "",
    propertyLocation: "",
    desiredValue: "",
    incomeProof: "",
    creditDefense: "",
    documents: null as FileList | null,
  })

  // Carregar operações ao iniciar
  useEffect(() => {
    loadOperations()
  }, [])

  // Carregar operações com base no filtro de status
  useEffect(() => {
    if (statusFilter === "all") {
      loadOperations()
    } else {
      loadOperationsByStatus(statusFilter)
    }
  }, [statusFilter])

  // Carregar operações com base no termo de busca
  useEffect(() => {
    if (searchTerm.trim() === "") {
      loadOperations()
    } else {
      searchForOperations(searchTerm)
    }
  }, [searchTerm])

  // Função para carregar todas as operações
  const loadOperations = async () => {
    try {
      setLoading(true)
      const data = await getOperations()
      setOperations(data)
    } catch (error) {
      console.error("Erro ao carregar operações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as operações.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para carregar operações por status
  const loadOperationsByStatus = async (status: string) => {
    try {
      setLoading(true)
      const data = await getOperationsByStatus(status)
      setOperations(data)
    } catch (error) {
      console.error("Erro ao filtrar operações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível filtrar as operações.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para buscar operações
  const searchForOperations = async (term: string) => {
    try {
      setLoading(true)
      const data = await searchOperations(term)
      setOperations(data)
    } catch (error) {
      console.error("Erro ao buscar operações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível buscar as operações.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } },
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({ ...prev, documents: e.target.files }))
    }
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1)
    } else {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios antes de prosseguir.",
        variant: "destructive",
      })
    }
  }

  const handlePreviousStep = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.personType &&
          formData.clientName &&
          formData.clientEmail &&
          formData.clientPhone &&
          formData.clientAddress &&
          formData.clientDocument
        )
      case 2:
        return formData.clientSalary && formData.profession && formData.professionalActivity
      case 3:
        return formData.propertyType && formData.propertyValue && formData.propertyLocation && formData.desiredValue
      case 4:
        return formData.incomeProof && formData.creditDefense && formData.documents
      default:
        return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep(4)) {
      try {
        setLoading(true)

        // Gerar número de operação
        const operationNumber = await generateOperationNumber()

        // Criar objeto de operação
        const newOperation: Omit<Operation, "id" | "createdAt" | "updatedAt"> = {
          number: operationNumber,
          client: formData.clientName,
          value: Number.parseFloat(formData.desiredValue),
          status: "Em andamento",
          personType: formData.personType,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone,
          clientAddress: formData.clientAddress,
          clientDocument: formData.clientDocument,
          clientSalary: Number.parseFloat(formData.clientSalary),
          profession: formData.profession,
          professionalActivity: formData.professionalActivity,
          propertyType: formData.propertyType,
          propertyValue: Number.parseFloat(formData.propertyValue),
          propertyLocation: formData.propertyLocation,
          desiredValue: Number.parseFloat(formData.desiredValue),
          incomeProof: formData.incomeProof,
          creditDefense: formData.creditDefense,
          documents: [],
        }

        // Adicionar operação ao Firestore
        const savedOperation = await addOperation(newOperation)

        // Upload de documentos se houver
        if (formData.documents && formData.documents.length > 0) {
          const uploadedDocs = await uploadDocuments(formData.documents, savedOperation.id!)

          // Atualizar operação com URLs dos documentos
          const docUrls = uploadedDocs.map((doc) => doc.url)
          await updateOperation(savedOperation.id!, { documents: docUrls })
        }

        // Recarregar operações
        await loadOperations()

        // Fechar diálogo e resetar formulário
        setIsDialogOpen(false)
        setCurrentStep(1)
        setFormData({
          personType: "fisica",
          clientName: "",
          clientEmail: "",
          clientPhone: "",
          clientAddress: "",
          clientDocument: "",
          clientSalary: "",
          profession: "",
          professionalActivity: "",
          propertyType: "",
          propertyValue: "",
          propertyLocation: "",
          desiredValue: "",
          incomeProof: "",
          creditDefense: "",
          documents: null,
        })

        toast({
          title: "Sucesso",
          description: "Operação cadastrada com sucesso!",
        })
      } catch (error) {
        console.error("Erro ao cadastrar operação:", error)
        toast({
          title: "Erro",
          description: "Não foi possível cadastrar a operação.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    } else {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios antes de enviar.",
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = async (operation: Operation) => {
    try {
      // Se já temos todos os detalhes, não precisamos buscar novamente
      if (operation.id) {
        const fullOperation = await getOperation(operation.id)
        setSelectedOperation(fullOperation)
        setIsDetailsDialogOpen(true)
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes da operação:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da operação.",
        variant: "destructive",
      })
    }
  }

  const formatLabel = (key: string) => {
    const labels: { [key: string]: string } = {
      personType: "Tipo de Pessoa",
      clientName: formData.personType === "fisica" ? "Nome do Cliente" : "Nome da Empresa",
      clientEmail: formData.personType === "fisica" ? "Email do Cliente" : "Email da Empresa",
      clientPhone: formData.personType === "fisica" ? "Telefone do Cliente" : "Telefone da Empresa",
      clientAddress: formData.personType === "fisica" ? "Endereço do Cliente" : "Endereço da Empresa",
      clientDocument: formData.personType === "fisica" ? "CPF" : "CNPJ",
      clientSalary: "Renda/Faturamento",
      profession: "Profissão",
      professionalActivity: "Atividade Profissional",
      propertyType: "Tipo de Imóvel",
      propertyValue: "Valor do Imóvel",
      propertyLocation: "Localização do Imóvel",
      desiredValue: "Valor Pretendido",
      incomeProof: "Comprovação de Renda",
      creditDefense: "Defesa de Crédito",
      documents: "Documentos",
      number: "Número da Operação",
      status: "Status",
      value: "Valor da Operação",
    }
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1)
  }

  const formatValue = (key: string, value: any) => {
    if (key === "personType") return value === "fisica" ? "Física" : "Jurídica"
    if (key === "clientSalary" || key === "propertyValue" || key === "desiredValue" || key === "value") {
      return `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    }
    if (key === "documents" && Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside">
          {value.map((doc, index) => (
            <li key={index}>
              <a href={doc} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Documento {index + 1}
              </a>
            </li>
          ))}
        </ul>
      )
    }
    return value
  }

  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="personType" className="text-xs">
                  Tipo de Pessoa*
                </Label>
                <Select
                  name="personType"
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, personType: value }))}
                  required
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisica">Física</SelectItem>
                    <SelectItem value="juridica">Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="clientName" className="text-xs">
                  {formData.personType === "fisica" ? "Nome do Cliente*" : "Nome da Empresa*"}
                </Label>
                <Input
                  id="clientName"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  required
                  className="h-8"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientDocument" className="text-xs">
                {formData.personType === "fisica" ? "CPF*" : "CNPJ*"}
              </Label>
              <Input
                id="clientDocument"
                name="clientDocument"
                value={formData.clientDocument}
                onChange={handleInputChange}
                required
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientEmail" className="text-xs">
                {formData.personType === "fisica" ? "Email do Cliente*" : "Email da Empresa*"}
              </Label>
              <Input
                id="clientEmail"
                name="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={handleInputChange}
                required
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientPhone" className="text-xs">
                {formData.personType === "fisica" ? "Telefone do Cliente*" : "Telefone da Empresa*"}
              </Label>
              <Input
                id="clientPhone"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleInputChange}
                required
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientAddress" className="text-xs">
                {formData.personType === "fisica" ? "Endereço do Cliente*" : "Endereço da Empresa*"}
              </Label>
              <Textarea
                id="clientAddress"
                name="clientAddress"
                value={formData.clientAddress}
                onChange={handleInputChange}
                required
                className="h-20 resize-none"
              />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="clientSalary" className="text-xs">
                Renda do Cliente*
              </Label>
              <Input
                id="clientSalary"
                name="clientSalary"
                type="number"
                value={formData.clientSalary}
                onChange={handleInputChange}
                required
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="profession" className="text-xs">
                Profissão*
              </Label>
              <Input
                id="profession"
                name="profession"
                value={formData.profession}
                onChange={handleInputChange}
                required
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="professionalActivity" className="text-xs">
                Atividade Profissional*
              </Label>
              <Textarea
                id="professionalActivity"
                name="professionalActivity"
                value={formData.professionalActivity}
                onChange={handleInputChange}
                required
                className="h-20 resize-none"
              />
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="propertyType" className="text-xs">
                Tipo de Imóvel*
              </Label>
              <Input
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                required
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="propertyValue" className="text-xs">
                Valor do Imóvel*
              </Label>
              <Input
                id="propertyValue"
                name="propertyValue"
                type="number"
                value={formData.propertyValue}
                onChange={handleInputChange}
                required
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="propertyLocation" className="text-xs">
                Localização do Imóvel*
              </Label>
              <Input
                id="propertyLocation"
                name="propertyLocation"
                value={formData.propertyLocation}
                onChange={handleInputChange}
                required
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="desiredValue" className="text-xs">
                Valor Pretendido*
              </Label>
              <Input
                id="desiredValue"
                name="desiredValue"
                type="number"
                value={formData.desiredValue}
                onChange={handleInputChange}
                required
                className="h-8"
              />
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="incomeProof" className="text-xs">
                Comprovação de Renda*
              </Label>
              <Textarea
                id="incomeProof"
                name="incomeProof"
                value={formData.incomeProof}
                onChange={handleInputChange}
                required
                className="h-20 resize-none"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="creditDefense" className="text-xs">
                Defesa de Crédito*
              </Label>
              <Textarea
                id="creditDefense"
                name="creditDefense"
                value={formData.creditDefense}
                onChange={handleInputChange}
                required
                className="h-20 resize-none"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="documents" className="text-xs">
                Documentos (PDF, PNG, JPEG)*
              </Label>
              <Input
                id="documents"
                name="documents"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                multiple
                onChange={handleFileChange}
                required
                className="h-8"
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-4">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Minhas Operações</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src="/img/tiago.cazarotto.jpg" />
                  <AvatarFallback>TC</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Perfil</DropdownMenuItem>
                <DropdownMenuItem>Configurações</DropdownMenuItem>
                <DropdownMenuItem>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-4 items-center">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar operações"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
                <SelectItem value="Em análise">Em análise</SelectItem>
                <SelectItem value="Declinada">Declinada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Operação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader className="space-y-1 pb-2">
                <DialogTitle className="text-lg">Nova Operação - Passo {currentStep}/4</DialogTitle>
                <DialogDescription className="text-sm">
                  Preencha os detalhes abaixo. Campos com * são obrigatórios.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-2">
                {renderFormStep()}
                <div className="flex justify-between pt-2">
                  {currentStep > 1 && (
                    <Button type="button" onClick={handlePreviousStep} size="sm">
                      Voltar
                    </Button>
                  )}
                  {currentStep < 4 ? (
                    <Button type="button" onClick={handleNextStep} className="ml-auto" size="sm">
                      Próximo
                    </Button>
                  ) : (
                    <Button type="submit" className="ml-auto" size="sm" disabled={loading}>
                      {loading ? "Cadastrando..." : "Cadastrar"}
                    </Button>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Operations Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número da Operação</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Carregando operações...
                </TableCell>
              </TableRow>
            ) : operations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Nenhuma operação encontrada
                </TableCell>
              </TableRow>
            ) : (
              operations.map((op) => (
                <TableRow key={op.id}>
                  <TableCell>{op.number}</TableCell>
                  <TableCell>{op.client}</TableCell>
                  <TableCell>R$ {op.value.toLocaleString("pt-BR")}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        op.status === "Em andamento"
                          ? "bg-yellow-200 text-yellow-800"
                          : op.status === "Concluída"
                            ? "bg-green-200 text-green-800"
                            : op.status === "Em análise"
                              ? "bg-blue-200 text-blue-800"
                              : "bg-red-200 text-red-800"
                      }`}
                    >
                      {op.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(op)}>
                      Ver detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[450px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Operação {selectedOperation?.number}</DialogTitle>
              <DialogDescription>Informações detalhadas sobre a operação selecionada.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedOperation &&
                Object.entries(selectedOperation)
                  .filter(([key]) => key !== "id" && key !== "createdAt" && key !== "updatedAt")
                  .map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <Label className="font-bold text-sm">{formatLabel(key)}</Label>
                      <p className="text-sm">{formatValue(key, value)}</p>
                    </div>
                  ))}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

