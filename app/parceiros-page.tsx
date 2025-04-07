"use client";

import { useState, useEffect } from "react";
import { Bell, Search, PlusCircle, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

// Funções de formatação
const formatCPF = (value: string) => {
  // Remove todos os caracteres não numéricos
  const numericValue = value.replace(/\D/g, "");

  // Aplica a máscara de CPF: 000.000.000-00
  if (numericValue.length <= 3) {
    return numericValue;
  } else if (numericValue.length <= 6) {
    return `${numericValue.slice(0, 3)}.${numericValue.slice(3)}`;
  } else if (numericValue.length <= 9) {
    return `${numericValue.slice(0, 3)}.${numericValue.slice(
      3,
      6
    )}.${numericValue.slice(6)}`;
  } else {
    return `${numericValue.slice(0, 3)}.${numericValue.slice(
      3,
      6
    )}.${numericValue.slice(6, 9)}-${numericValue.slice(9, 11)}`;
  }
};

const formatCNPJ = (value: string) => {
  // Remove todos os caracteres não numéricos
  const numericValue = value.replace(/\D/g, "");

  // Aplica a máscara de CNPJ: 00.000.000/0000-00
  if (numericValue.length <= 2) {
    return numericValue;
  } else if (numericValue.length <= 5) {
    return `${numericValue.slice(0, 2)}.${numericValue.slice(2)}`;
  } else if (numericValue.length <= 8) {
    return `${numericValue.slice(0, 2)}.${numericValue.slice(
      2,
      5
    )}.${numericValue.slice(5)}`;
  } else if (numericValue.length <= 12) {
    return `${numericValue.slice(0, 2)}.${numericValue.slice(
      2,
      5
    )}.${numericValue.slice(5, 8)}/${numericValue.slice(8)}`;
  } else {
    return `${numericValue.slice(0, 2)}.${numericValue.slice(
      2,
      5
    )}.${numericValue.slice(5, 8)}/${numericValue.slice(
      8,
      12
    )}-${numericValue.slice(12, 14)}`;
  }
};

const formatPhone = (value: string) => {
  // Remove todos os caracteres não numéricos
  const numericValue = value.replace(/\D/g, "");

  // Aplica a máscara de telefone: (00) 00000-0000 ou (00) 0000-0000
  if (numericValue.length <= 2) {
    return numericValue.length ? `(${numericValue}` : "";
  } else if (numericValue.length <= 6) {
    return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2)}`;
  } else if (numericValue.length <= 10) {
    return `(${numericValue.slice(0, 2)}) ${numericValue.slice(
      2,
      6
    )}-${numericValue.slice(6)}`;
  } else {
    return `(${numericValue.slice(0, 2)}) ${numericValue.slice(
      2,
      7
    )}-${numericValue.slice(7, 11)}`;
  }
};

const formatAgencia = (value: string) => {
  // Remove todos os caracteres não numéricos
  const numericValue = value.replace(/\D/g, "");

  // Limita a 4 dígitos para agência
  return numericValue.slice(0, 4);
};

const formatConta = (value: string) => {
  // Remove todos os caracteres não numéricos
  const numericValue = value.replace(/\D/g, "");

  // Aplica a máscara de conta: 00000-0
  if (numericValue.length <= 5) {
    return numericValue;
  } else {
    return `${numericValue.slice(
      0,
      numericValue.length - 1
    )}-${numericValue.slice(numericValue.length - 1)}`;
  }
};

// Função para remover formatação antes de salvar no banco
const removeFormatting = (value: string) => {
  return value.replace(/\D/g, "");
};

export default function ParceirosPage() {
  const { toast } = useToast();

  // Estados para o formulário e diálogos
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState("cpf");

  // Estado para armazenar parceiros vindos do Firestore
  const [parceirosData, setParceirosData] = useState([]);

  // Estado para os dados do formulário de cadastro
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    tipoDocumento: "cpf",
    documento: "",
    email: "",
    telefone: "",
    endereco: "",
    banco: "",
    agencia: "",
    conta: "",
    tipoConta: "corrente",
    pix: "",
    observacoes: "",
  });

  // Estado para os valores formatados exibidos nos inputs
  const [formattedValues, setFormattedValues] = useState({
    documento: "",
    telefone: "",
    agencia: "",
    conta: "",
  });

  // Função para buscar os parceiros do Firestore
  const fetchParceiros = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "parceiros"));
      const parceiros = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setParceirosData(parceiros);
    } catch (error) {
      console.error("Erro ao buscar parceiros:", error);
    }
  };

  // Busca os parceiros ao carregar o componente
  useEffect(() => {
    fetchParceiros();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Para campos que precisam de formatação
    if (name === "documento") {
      const formattedValue =
        tipoDocumento === "cpf" ? formatCPF(value) : formatCNPJ(value);
      setFormattedValues((prev) => ({ ...prev, documento: formattedValue }));
      setFormData((prev) => ({ ...prev, documento: removeFormatting(value) }));
    } else if (name === "telefone") {
      const formattedValue = formatPhone(value);
      setFormattedValues((prev) => ({ ...prev, telefone: formattedValue }));
      setFormData((prev) => ({ ...prev, telefone: removeFormatting(value) }));
    } else if (name === "agencia") {
      const formattedValue = formatAgencia(value);
      setFormattedValues((prev) => ({ ...prev, agencia: formattedValue }));
      setFormData((prev) => ({ ...prev, agencia: formattedValue }));
    } else if (name === "conta") {
      const formattedValue = formatConta(value);
      setFormattedValues((prev) => ({ ...prev, conta: formattedValue }));
      setFormData((prev) => ({ ...prev, conta: removeFormatting(value) }));
    }
    // Para outros campos sem formatação especial
    else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "tipoDocumento") {
      setTipoDocumento(value);
      // Limpa o campo de documento quando muda o tipo
      setFormattedValues((prev) => ({ ...prev, documento: "" }));
      setFormData((prev) => ({ ...prev, documento: "" }));
    }
  };

  const validateForm = () => {
    // Validação básica dos campos obrigatórios
    return (
      formData.nomeCompleto &&
      formData.documento &&
      formData.email &&
      formData.telefone &&
      formData.banco &&
      formData.agencia &&
      formData.conta
    );
  };

  // Envio do formulário para cadastrar novo parceiro
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        // Adiciona o parceiro ao Firestore
        await addDoc(collection(db, "parceiros"), {
          ...formData,
          dataCadastro: new Date(),
        });

        toast({
          title: "Sucesso!",
          description: "Parceiro cadastrado com sucesso!",
          variant: "default",
          duration: 3000,
        });

        // Atualiza a lista após cadastro
        fetchParceiros();

        // Reseta o formulário e fecha o diálogo
        setIsDialogOpen(false);
        setFormData({
          nomeCompleto: "",
          tipoDocumento: "cpf",
          documento: "",
          email: "",
          telefone: "",
          endereco: "",
          banco: "",
          agencia: "",
          conta: "",
          tipoConta: "corrente",
          pix: "",
          observacoes: "",
        });
        setFormattedValues({
          documento: "",
          telefone: "",
          agencia: "",
          conta: "",
        });
      } catch (error) {
        console.error("Erro ao cadastrar parceiro:", error);

        toast({
          title: "Erro!",
          description: "Não foi possível cadastrar o parceiro.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } else {
      toast({
        title: "Atenção!",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleViewDetails = (partner) => {
    setSelectedPartner(partner);
    setIsDetailsDialogOpen(true);
  };

  // Filtra os parceiros conforme a busca
  const filteredParceiros = parceirosData.filter(
    (parceiro) =>
      parceiro.nomeCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parceiro.documento?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para formatação dos rótulos exibidos nos detalhes
  const formatLabel = (key) => {
    const labels = {
      nomeCompleto: "Nome Completo",
      tipoDocumento: "Tipo de Documento",
      documento: "Documento",
      email: "E-mail",
      telefone: "Telefone",
      endereco: "Endereço",
      banco: "Banco",
      agencia: "Agência",
      conta: "Conta",
      tipoConta: "Tipo de Conta",
      pix: "Chave PIX",
      observacoes: "Observações",
      dataCadastro: "Data de Cadastro",
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  // Função para formatação dos valores exibidos nos detalhes
  const formatValue = (key, value) => {
    if (key === "tipoDocumento") return value === "cpf" ? "CPF" : "CNPJ";
    if (key === "tipoConta")
      return value === "corrente" ? "Conta Corrente" : "Conta Poupança";
    if (key === "dataCadastro" && value?.toDate) {
      return value.toDate().toLocaleDateString("pt-BR");
    }
    if (key === "documento") {
      if (selectedPartner?.tipoDocumento === "cpf") {
        return formatCPF(value);
      } else {
        return formatCNPJ(value);
      }
    }
    if (key === "telefone") {
      return formatPhone(value);
    }
    if (key === "conta") {
      return formatConta(value);
    }
    return value;
  };

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
            <h1 className="text-2xl font-bold">Parceiros Comerciais</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarFallback>User</AvatarFallback>
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

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar parceiros"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Parceiro
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[500px] h-auto max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Parceiro</DialogTitle>
                <DialogDescription>
                  Preencha os dados do parceiro comercial. Campos com * são
                  obrigatórios.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4 px-1">
                <div className="space-y-2">
                  <Label htmlFor="nomeCompleto">Nome Completo*</Label>
                  <Input
                    id="nomeCompleto"
                    name="nomeCompleto"
                    value={formData.nomeCompleto}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoDocumento">Tipo de Documento*</Label>
                    <Select
                      name="tipoDocumento"
                      value={formData.tipoDocumento}
                      onValueChange={(value) =>
                        handleSelectChange("tipoDocumento", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documento">
                      {formData.tipoDocumento === "cpf" ? "CPF*" : "CNPJ*"}
                    </Label>
                    <Input
                      id="documento"
                      name="documento"
                      value={formattedValues.documento}
                      onChange={handleInputChange}
                      required
                      maxLength={formData.tipoDocumento === "cpf" ? 14 : 18}
                      placeholder={
                        formData.tipoDocumento === "cpf"
                          ? "000.000.000-00"
                          : "00.000.000/0000-00"
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail*</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="exemplo@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone*</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      value={formattedValues.telefone}
                      onChange={handleInputChange}
                      required
                      maxLength={15}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Textarea
                    id="endereco"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleInputChange}
                    className="resize-none"
                    placeholder="Rua, número, bairro, cidade, estado, CEP"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Dados Bancários</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="banco">Banco*</Label>
                      <Input
                        id="banco"
                        name="banco"
                        value={formData.banco}
                        onChange={handleInputChange}
                        required
                        placeholder="Nome do banco"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agencia">Agência*</Label>
                      <Input
                        id="agencia"
                        name="agencia"
                        value={formattedValues.agencia}
                        onChange={handleInputChange}
                        required
                        maxLength={4}
                        placeholder="0000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="conta">Conta*</Label>
                      <Input
                        id="conta"
                        name="conta"
                        value={formattedValues.conta}
                        onChange={handleInputChange}
                        required
                        maxLength={8}
                        placeholder="00000-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipoConta">Tipo de Conta</Label>
                      <Select
                        name="tipoConta"
                        value={formData.tipoConta}
                        onValueChange={(value) =>
                          handleSelectChange("tipoConta", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corrente">
                            Conta Corrente
                          </SelectItem>
                          <SelectItem value="poupanca">
                            Conta Poupança
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    <Label htmlFor="pix">Chave PIX</Label>
                    <Input
                      id="pix"
                      name="pix"
                      value={formData.pix}
                      onChange={handleInputChange}
                      placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    className="resize-none"
                    placeholder="Informações adicionais sobre o parceiro"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit">Cadastrar Parceiro</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabela de Parceiros */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParceiros.length > 0 ? (
                filteredParceiros.map((parceiro) => (
                  <TableRow key={parceiro.id}>
                    <TableCell className="font-medium">
                      {parceiro.nomeCompleto}
                    </TableCell>
                    <TableCell>
                      {parceiro.tipoDocumento === "cpf" ? "CPF: " : "CNPJ: "}
                      {parceiro.tipoDocumento === "cpf"
                        ? formatCPF(parceiro.documento)
                        : formatCNPJ(parceiro.documento)}
                    </TableCell>
                    <TableCell>{formatPhone(parceiro.telefone)}</TableCell>
                    <TableCell>{parceiro.banco}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(parceiro)}
                      >
                        Ver detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Nenhum parceiro encontrado. Cadastre um novo parceiro.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Diálogo com os detalhes do parceiro */}
        <Dialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
        >
          <DialogContent className="w-[95vw] max-w-[500px] h-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Parceiro</DialogTitle>
              <DialogDescription>
                Informações completas do parceiro comercial.
              </DialogDescription>
            </DialogHeader>
            {selectedPartner && (
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(selectedPartner)
                    .filter(([key]) => key !== "id")
                    .map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <Label className="font-bold text-sm">
                          {formatLabel(key)}
                        </Label>
                        <p className="text-sm">{formatValue(key, value)}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Toaster />
    </div>
  );
}
