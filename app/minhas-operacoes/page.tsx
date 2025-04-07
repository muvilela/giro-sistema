"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  Search,
  PlusCircle,
  ArrowLeft,
  Pencil,
  Trash2,
  MapPin,
  AlertCircle,
} from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Script from "next/script";

// Importando funções do Firebase
import {
  getOperations,
  getOperationsByStatus,
  searchOperations,
  addOperation,
  getOperation,
  updateOperation,
  deleteOperation,
  uploadDocuments,
  generateOperationNumber,
  type Operation,
} from "@/lib/operations";

// Importando funções para buscar parceiros do Firebase
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

// Interface para parceiros
interface Partner {
  id: string;
  nomeCompleto: string;
  tipoDocumento: string;
  documento: string;
  email: string;
  telefone: string;
  [key: string]: any; // Para outros campos que possam existir
}

// Tipos de imóveis disponíveis
const propertyTypes = [
  "Casa de Condomínio",
  "Casa de Rua",
  "Apartamento",
  "Sala Comercial",
  "Terreno de Condomínio",
  "Galpão",
  "Chácara",
  "Outros",
];

// Tipos de comprovação de renda
const incomeProofTypes = ["Holerite", "Imposto de Renda", "Extrato Bancário"];

// Regex para validações
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\(?([0-9]{2})\)?[-. ]?([0-9]{4,5})[-. ]?([0-9]{4})$/;
const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;

// Funções de formatação
const formatPhone = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, "");

  // Aplica a formatação conforme o usuário digita
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(
      6
    )}`;
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7,
      11
    )}`;
  }
};

const formatCPF = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, "");

  // Aplica a formatação conforme o usuário digita
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  } else {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
      6,
      9
    )}-${numbers.slice(9, 11)}`;
  }
};

const formatCNPJ = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, "");

  // Aplica a formatação conforme o usuário digita
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  } else if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
      5,
      8
    )}/${numbers.slice(8)}`;
  } else {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
      5,
      8
    )}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  }
};

// Interface para erros de validação
interface ValidationErrors {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientDocument?: string;
  clientSalary?: string;
  profession?: string;
  professionalActivity?: string;
  propertyType?: string;
  propertyValue?: string;
  propertyLocation?: string;
  desiredValue?: string;
  incomeProof?: string;
  creditDefense?: string;
  documents?: string;
  partnerId?: string;
}

// Declaração para o Google Maps API
declare global {
  interface Window {
    initGoogleMapsAutocomplete: () => void;
    google: any;
  }
}

export default function MinhasOperacoesPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(
    null
  );
  const [operationToDelete, setOperationToDelete] = useState<Operation | null>(
    null
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Estado para armazenar parceiros
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);

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
    partnerId: "", // Novo campo para o parceiro que indicou
  });

  // Estado para mensagens de sucesso e erro
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado para erros de validação
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  // Estado para o endereço do Google Maps
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  // Referência para o input de localização e autocomplete
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Estado para verificar se o Google Maps API está carregado
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Carregar operações ao iniciar
  useEffect(() => {
    loadOperations();
    loadPartners(); // Carregar parceiros ao iniciar
  }, []);

  // Função para carregar parceiros do Firebase
  const loadPartners = async () => {
    try {
      setLoadingPartners(true);
      const querySnapshot = await getDocs(collection(db, "parceiros"));
      const partnersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Partner[];
      setPartners(partnersData);
    } catch (error) {
      console.error("Erro ao carregar parceiros:", error);
      setErrorMessage("Não foi possível carregar os parceiros.");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoadingPartners(false);
    }
  };

  // Inicializar o autocomplete do Google Maps quando a API estiver carregada
  useEffect(() => {
    if (mapsLoaded && locationInputRef.current) {
      initGoogleMapsAutocomplete();
    }
  }, [mapsLoaded, isDialogOpen, currentStep]);

  // Função para inicializar o autocomplete do Google Maps
  const initGoogleMapsAutocomplete = () => {
    if (!window.google || !locationInputRef.current) return;

    // Criar o autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      locationInputRef.current,
      {
        types: ["address"],
        componentRestrictions: { country: "br" },
      }
    );

    // Adicionar listener para quando um lugar for selecionado
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      if (place && place.formatted_address) {
        setFormData((prev) => ({
          ...prev,
          propertyLocation: place.formatted_address,
        }));
        setShowAddressSuggestions(false);
      }
    });
  };

  // Função para quando o script do Google Maps é carregado
  const handleMapsLoaded = () => {
    setMapsLoaded(true);
  };

  // Carregar operações com base no filtro de status
  useEffect(() => {
    if (statusFilter === "all") {
      loadOperations();
    } else {
      loadOperationsByStatus(statusFilter);
    }
  }, [statusFilter]);

  // Carregar operações com base no termo de busca
  useEffect(() => {
    if (searchTerm.trim() === "") {
      loadOperations();
    } else {
      searchForOperations(searchTerm);
    }
  }, [searchTerm]);

  // Função para carregar todas as operações
  const loadOperations = async () => {
    try {
      setLoading(true);
      const data = await getOperations();
      setOperations(data);
    } catch (error) {
      console.error("Erro ao carregar operações:", error);
      setErrorMessage("Não foi possível carregar as operações.");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar operações por status
  const loadOperationsByStatus = async (status: string) => {
    try {
      setLoading(true);
      const data = await getOperationsByStatus(status);
      setOperations(data);
    } catch (error) {
      console.error("Erro ao filtrar operações:", error);
      setErrorMessage("Não foi possível filtrar as operações.");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar operações
  const searchForOperations = async (term: string) => {
    try {
      setLoading(true);
      const data = await searchOperations(term);
      setOperations(data);
    } catch (error) {
      console.error("Erro ao buscar operações:", error);
      setErrorMessage("Não foi possível buscar as operações.");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Aplicar formatação específica para certos campos
    if (name === "clientPhone") {
      formattedValue = formatPhone(value);
    } else if (name === "clientDocument") {
      if (formData.personType === "fisica") {
        formattedValue = formatCPF(value);
      } else {
        formattedValue = formatCNPJ(value);
      }
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

    // Limpar erro de validação ao editar o campo
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpar erro de validação ao editar o campo
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({ ...prev, documents: e.target.files }));

      // Limpar erro de validação ao editar o campo
      if (validationErrors.documents) {
        setValidationErrors((prev) => ({ ...prev, documents: undefined }));
      }
    }
  };

  const handleNextStep = () => {
    const errors = validateCurrentStep(currentStep);

    if (Object.keys(errors).length === 0) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setValidationErrors(errors);
      setErrorMessage("Por favor, corrija os erros antes de prosseguir.");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Validação detalhada por etapa
  const validateCurrentStep = (step: number): ValidationErrors => {
    const errors: ValidationErrors = {};

    switch (step) {
      case 1:
        // Validação do nome
        if (!formData.clientName.trim()) {
          errors.clientName = "Nome é obrigatório";
        } else if (formData.clientName.length < 3) {
          errors.clientName = "Nome deve ter pelo menos 3 caracteres";
        }

        // Validação do email
        if (!formData.clientEmail.trim()) {
          errors.clientEmail = "Email é obrigatório";
        } else if (!emailRegex.test(formData.clientEmail)) {
          errors.clientEmail = "Email inválido";
        }

        // Validação do telefone
        if (!formData.clientPhone.trim()) {
          errors.clientPhone = "Telefone é obrigatório";
        } else if (!phoneRegex.test(formData.clientPhone)) {
          errors.clientPhone = "Telefone inválido (ex: (11) 98765-4321)";
        }

        // Validação do endereço
        if (!formData.clientAddress.trim()) {
          errors.clientAddress = "Endereço é obrigatório";
        } else if (formData.clientAddress.length < 10) {
          errors.clientAddress = "Endereço deve ser mais detalhado";
        }

        // Validação do documento (CPF/CNPJ)
        if (!formData.clientDocument.trim()) {
          errors.clientDocument = "Documento é obrigatório";
        } else if (
          formData.personType === "fisica" &&
          !cpfRegex.test(formData.clientDocument)
        ) {
          errors.clientDocument = "CPF inválido (ex: 123.456.789-00)";
        } else if (
          formData.personType === "juridica" &&
          !cnpjRegex.test(formData.clientDocument)
        ) {
          errors.clientDocument = "CNPJ inválido (ex: 12.345.678/0001-90)";
        }
        break;

      case 2:
        // Validação da renda
        if (!formData.clientSalary) {
          errors.clientSalary = "Renda é obrigatória";
        } else if (Number(formData.clientSalary) <= 0) {
          errors.clientSalary = "Renda deve ser maior que zero";
        }

        // Validação da profissão
        if (!formData.profession.trim()) {
          errors.profession = "Profissão é obrigatória";
        }

        // Validação da atividade profissional
        if (!formData.professionalActivity.trim()) {
          errors.professionalActivity = "Atividade profissional é obrigatória";
        } else if (formData.professionalActivity.length < 10) {
          errors.professionalActivity =
            "Descreva a atividade com mais detalhes";
        }
        break;

      case 3:
        // Validação do tipo de imóvel
        if (!formData.propertyType) {
          errors.propertyType = "Tipo de imóvel é obrigatório";
        }

        // Validação do valor do imóvel
        if (!formData.propertyValue) {
          errors.propertyValue = "Valor do imóvel é obrigatório";
        } else if (Number(formData.propertyValue) <= 0) {
          errors.propertyValue = "Valor do imóvel deve ser maior que zero";
        }

        // Validação da localização
        if (!formData.propertyLocation.trim()) {
          errors.propertyLocation = "Localização do imóvel é obrigatória";
        }

        // Validação do valor pretendido
        if (!formData.desiredValue) {
          errors.desiredValue = "Valor pretendido é obrigatório";
        } else if (Number(formData.desiredValue) <= 0) {
          errors.desiredValue = "Valor pretendido deve ser maior que zero";
        } else if (
          Number(formData.desiredValue) > Number(formData.propertyValue)
        ) {
          errors.desiredValue =
            "Valor pretendido não pode ser maior que o valor do imóvel";
        }
        break;

      case 4:
        // Validação da comprovação de renda
        if (!formData.incomeProof) {
          errors.incomeProof = "Comprovação de renda é obrigatória";
        }

        // Validação da defesa de crédito
        if (!formData.creditDefense.trim()) {
          errors.creditDefense = "Defesa de crédito é obrigatória";
        } else if (formData.creditDefense.length < 10) {
          errors.creditDefense =
            "Descreva a defesa de crédito com mais detalhes";
        }

        // Validação dos documentos (apenas para novos cadastros)
        if (
          !isEditMode &&
          (!formData.documents || formData.documents.length === 0)
        ) {
          errors.documents = "Pelo menos um documento é obrigatório";
        }
        break;
    }

    return errors;
  };

  const validateAllSteps = (): ValidationErrors => {
    let allErrors: ValidationErrors = {};

    for (let step = 1; step <= 4; step++) {
      const stepErrors = validateCurrentStep(step);
      allErrors = { ...allErrors, ...stepErrors };
    }

    return allErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allErrors = validateAllSteps();

    if (Object.keys(allErrors).length === 0) {
      try {
        setLoading(true);

        if (isEditMode && selectedOperation?.id) {
          // Atualizar operação existente
          const updatedOperation: Partial<Operation> = {
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
            partnerId: formData.partnerId || null, // Incluir o parceiro que indicou
          };

          await updateOperation(selectedOperation.id, updatedOperation);

          // Upload de novos documentos se houver
          if (formData.documents && formData.documents.length > 0) {
            const uploadedDocs = await uploadDocuments(
              formData.documents,
              selectedOperation.id
            );
            const docUrls = uploadedDocs.map((doc) => doc.url);

            // Combinar documentos existentes com novos
            const allDocs = [
              ...(selectedOperation.documents || []),
              ...docUrls,
            ];
            await updateOperation(selectedOperation.id, { documents: allDocs });
          }

          setSuccessMessage(
            `Operação ${selectedOperation.number} atualizada com sucesso!`
          );
        } else {
          // Criar nova operação
          const operationNumber = await generateOperationNumber();

          const newOperation: Omit<
            Operation,
            "id" | "createdAt" | "updatedAt"
          > = {
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
            partnerId: formData.partnerId || null, // Incluir o parceiro que indicou
          };

          const savedOperation = await addOperation(newOperation);

          if (formData.documents && formData.documents.length > 0) {
            const uploadedDocs = await uploadDocuments(
              formData.documents,
              savedOperation.id!
            );
            const docUrls = uploadedDocs.map((doc) => doc.url);
            await updateOperation(savedOperation.id!, { documents: docUrls });
          }

          setSuccessMessage(
            `Operação ${operationNumber} cadastrada com sucesso!`
          );
        }

        // Recarregar operações
        await loadOperations();

        // Fechar diálogo e resetar formulário
        setIsDialogOpen(false);
        setIsEditMode(false);
        setCurrentStep(1);
        resetForm();

        // Esconder a mensagem após 5 segundos
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } catch (error) {
        console.error("Erro ao processar operação:", error);
        setErrorMessage("Erro ao processar operação");
        setTimeout(() => setErrorMessage(null), 5000);
      } finally {
        setLoading(false);
      }
    } else {
      setValidationErrors(allErrors);
      setErrorMessage("Por favor, corrija os erros antes de enviar.");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const resetForm = () => {
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
      partnerId: "", // Resetar o parceiro
    });
    setValidationErrors({});
  };

  const handleViewDetails = async (operation: Operation) => {
    try {
      if (operation.id) {
        const fullOperation = await getOperation(operation.id);
        setSelectedOperation(fullOperation);
        setIsDetailsDialogOpen(true);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes da operação:", error);
      setErrorMessage("Não foi possível carregar os detalhes da operação.");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleEditOperation = (operation: Operation) => {
    setSelectedOperation(operation);
    setIsEditMode(true);

    // Preencher o formulário com os dados da operação
    setFormData({
      personType: operation.personType,
      clientName: operation.clientName,
      clientEmail: operation.clientEmail,
      clientPhone: operation.clientPhone,
      clientAddress: operation.clientAddress,
      clientDocument: operation.clientDocument,
      clientSalary: operation.clientSalary.toString(),
      profession: operation.profession,
      professionalActivity: operation.professionalActivity,
      propertyType: operation.propertyType,
      propertyValue: operation.propertyValue.toString(),
      propertyLocation: operation.propertyLocation,
      desiredValue: operation.desiredValue.toString(),
      incomeProof: operation.incomeProof,
      creditDefense: operation.creditDefense,
      documents: null,
      partnerId: operation.partnerId || "", // Incluir o parceiro que indicou
    });

    setCurrentStep(1);
    setIsDialogOpen(true);
    setValidationErrors({});
  };

  const handleDeleteOperation = (operation: Operation) => {
    setOperationToDelete(operation);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteOperation = async () => {
    if (operationToDelete?.id) {
      try {
        setLoading(true);
        await deleteOperation(operationToDelete.id);
        await loadOperations();
        setSuccessMessage(
          `Operação ${operationToDelete.number} excluída com sucesso!`
        );
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (error) {
        console.error("Erro ao excluir operação:", error);
        setErrorMessage("Não foi possível excluir a operação.");
        setTimeout(() => setErrorMessage(null), 5000);
      } finally {
        setLoading(false);
        setIsDeleteDialogOpen(false);
        setOperationToDelete(null);
      }
    }
  };

  const formatLabel = (key: string) => {
    const labels: { [key: string]: string } = {
      personType: "Tipo de Pessoa",
      clientName:
        formData.personType === "fisica"
          ? "Nome do Cliente"
          : "Nome da Empresa",
      clientEmail:
        formData.personType === "fisica"
          ? "Email do Cliente"
          : "Email da Empresa",
      clientPhone:
        formData.personType === "fisica"
          ? "Telefone do Cliente"
          : "Telefone da Empresa",
      clientAddress:
        formData.personType === "fisica"
          ? "Endereço do Cliente"
          : "Endereço da Empresa",
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
      partnerId: "Parceiro Indicador",
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  const formatValue = (key: string, value: any) => {
    if (key === "personType") return value === "fisica" ? "Física" : "Jurídica";
    if (
      key === "clientSalary" ||
      key === "propertyValue" ||
      key === "desiredValue" ||
      key === "value"
    ) {
      return `R$ ${Number(value).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}`;
    }
    if (key === "documents" && Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside">
          {value.map((doc, index) => (
            <li key={index}>
              <a
                href={doc}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Documento {index + 1}
              </a>
            </li>
          ))}
        </ul>
      );
    }
    if (key === "partnerId" && value) {
      const partner = partners.find((p) => p.id === value);
      return partner ? partner.nomeCompleto : value;
    }
    return value;
  };

  // Componente para exibir erro de validação
  const ValidationError = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <div className="text-red-500 text-xs flex items-center mt-1">
        <AlertCircle className="h-3 w-3 mr-1" />
        <span>{error}</span>
      </div>
    );
  };

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
                  value={formData.personType}
                  onValueChange={(value) =>
                    handleSelectChange("personType", value)
                  }
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
                  {formData.personType === "fisica"
                    ? "Nome do Cliente*"
                    : "Nome da Empresa*"}
                </Label>
                <Input
                  id="clientName"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  required
                  className={`h-8 ${
                    validationErrors.clientName ? "border-red-500" : ""
                  }`}
                />
                <ValidationError error={validationErrors.clientName} />
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
                className={`h-8 ${
                  validationErrors.clientDocument ? "border-red-500" : ""
                }`}
                placeholder={
                  formData.personType === "fisica"
                    ? "123.456.789-00"
                    : "12.345.678/0001-90"
                }
              />
              <ValidationError error={validationErrors.clientDocument} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientEmail" className="text-xs">
                {formData.personType === "fisica"
                  ? "Email do Cliente*"
                  : "Email da Empresa*"}
              </Label>
              <Input
                id="clientEmail"
                name="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={handleInputChange}
                required
                className={`h-8 ${
                  validationErrors.clientEmail ? "border-red-500" : ""
                }`}
                placeholder="exemplo@email.com"
              />
              <ValidationError error={validationErrors.clientEmail} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientPhone" className="text-xs">
                {formData.personType === "fisica"
                  ? "Telefone do Cliente*"
                  : "Telefone da Empresa*"}
              </Label>
              <Input
                id="clientPhone"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleInputChange}
                required
                className={`h-8 ${
                  validationErrors.clientPhone ? "border-red-500" : ""
                }`}
                placeholder="(11) 98765-4321"
              />
              <ValidationError error={validationErrors.clientPhone} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientAddress" className="text-xs">
                {formData.personType === "fisica"
                  ? "Endereço do Cliente*"
                  : "Endereço da Empresa*"}
              </Label>
              <Textarea
                id="clientAddress"
                name="clientAddress"
                value={formData.clientAddress}
                onChange={handleInputChange}
                required
                className={`h-20 resize-none ${
                  validationErrors.clientAddress ? "border-red-500" : ""
                }`}
              />
              <ValidationError error={validationErrors.clientAddress} />
            </div>

            {/* Campo para selecionar o parceiro que indicou */}
            <div className="space-y-1">
              <Label htmlFor="partnerId" className="text-xs">
                Parceiro que Indicou
              </Label>
              <Select
                name="partnerId"
                value={formData.partnerId}
                onValueChange={(value) =>
                  handleSelectChange("partnerId", value)
                }
              >
                <SelectTrigger
                  className={`h-8 ${
                    validationErrors.partnerId ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Selecione um parceiro (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.nomeCompleto} -{" "}
                      {partner.tipoDocumento === "cpf" ? "CPF" : "CNPJ"}:{" "}
                      {partner.tipoDocumento === "cpf"
                        ? formatCPF(partner.documento)
                        : formatCNPJ(partner.documento)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ValidationError error={validationErrors.partnerId} />
            </div>
          </div>
        );
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
                className={`h-8 ${
                  validationErrors.clientSalary ? "border-red-500" : ""
                }`}
              />
              <ValidationError error={validationErrors.clientSalary} />
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
                className={`h-8 ${
                  validationErrors.profession ? "border-red-500" : ""
                }`}
              />
              <ValidationError error={validationErrors.profession} />
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
                className={`h-20 resize-none ${
                  validationErrors.professionalActivity ? "border-red-500" : ""
                }`}
              />
              <ValidationError error={validationErrors.professionalActivity} />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="propertyType" className="text-xs">
                Tipo de Imóvel*
              </Label>
              <Select
                value={formData.propertyType}
                onValueChange={(value) =>
                  handleSelectChange("propertyType", value)
                }
                required
              >
                <SelectTrigger
                  className={`h-8 ${
                    validationErrors.propertyType ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Selecione o tipo de imóvel" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ValidationError error={validationErrors.propertyType} />
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
                className={`h-8 ${
                  validationErrors.propertyValue ? "border-red-500" : ""
                }`}
              />
              <ValidationError error={validationErrors.propertyValue} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="propertyLocation" className="text-xs">
                Localização do Imóvel*
              </Label>
              <div className="relative">
                <div className="flex">
                  <Input
                    id="propertyLocation"
                    name="propertyLocation"
                    value={formData.propertyLocation}
                    onChange={handleInputChange}
                    required
                    className={`h-8 pr-10 ${
                      validationErrors.propertyLocation ? "border-red-500" : ""
                    }`}
                    placeholder="Digite o endereço para buscar"
                    ref={locationInputRef}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    <MapPin size={16} />
                  </div>
                </div>
                <ValidationError error={validationErrors.propertyLocation} />
              </div>
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
                className={`h-8 ${
                  validationErrors.desiredValue ? "border-red-500" : ""
                }`}
              />
              <ValidationError error={validationErrors.desiredValue} />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="incomeProof" className="text-xs">
                Comprovação de Renda*
              </Label>
              <Select
                value={formData.incomeProof}
                onValueChange={(value) =>
                  handleSelectChange("incomeProof", value)
                }
                required
              >
                <SelectTrigger
                  className={`h-8 ${
                    validationErrors.incomeProof ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Selecione o tipo de comprovação" />
                </SelectTrigger>
                <SelectContent>
                  {incomeProofTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ValidationError error={validationErrors.incomeProof} />
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
                className={`h-20 resize-none ${
                  validationErrors.creditDefense ? "border-red-500" : ""
                }`}
              />
              <ValidationError error={validationErrors.creditDefense} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="documents" className="text-xs">
                {isEditMode
                  ? "Documentos Adicionais (PDF, PNG, JPEG)"
                  : "Documentos (PDF, PNG, JPEG)*"}
              </Label>
              <Input
                id="documents"
                name="documents"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                multiple
                onChange={handleFileChange}
                required={!isEditMode}
                className={`h-8 ${
                  validationErrors.documents ? "border-red-500" : ""
                }`}
              />
              <ValidationError error={validationErrors.documents} />
              {isEditMode &&
                selectedOperation?.documents &&
                selectedOperation.documents.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium">
                      Documentos existentes:
                    </p>
                    <ul className="list-disc list-inside text-xs">
                      {selectedOperation.documents.map((doc, index) => (
                        <li key={index}>
                          <a
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Documento {index + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Reformatar o documento quando o tipo de pessoa mudar
  useEffect(() => {
    if (formData.clientDocument) {
      const numbers = formData.clientDocument.replace(/\D/g, "");
      const formattedDocument =
        formData.personType === "fisica"
          ? formatCPF(numbers)
          : formatCNPJ(numbers);

      setFormData((prev) => ({
        ...prev,
        clientDocument: formattedDocument,
      }));
    }
  }, [formData.personType]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Carregar Google Maps API */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`}
        onLoad={handleMapsLoaded}
      />

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
        {/* Mensagens de sucesso e erro */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex justify-between items-center">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-700 hover:text-green-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-700 hover:text-red-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

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
                <DialogTitle className="text-lg">
                  {isEditMode
                    ? `Editar Operação ${selectedOperation?.number}`
                    : "Nova Operação"}{" "}
                  - Passo {currentStep}
                  /4
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Preencha os detalhes abaixo. Campos com * são obrigatórios.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-2">
                {renderFormStep()}
                <div className="flex justify-between pt-2">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      onClick={handlePreviousStep}
                      size="sm"
                    >
                      Voltar
                    </Button>
                  )}
                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="ml-auto"
                      size="sm"
                    >
                      Próximo
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="ml-auto"
                      size="sm"
                      disabled={loading}
                    >
                      {loading
                        ? "Processando..."
                        : isEditMode
                        ? "Atualizar"
                        : "Cadastrar"}
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
              <TableHead>Parceiro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Carregando operações...
                </TableCell>
              </TableRow>
            ) : operations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
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
                    {op.partnerId ? (
                      partners.find((p) => p.id === op.partnerId)
                        ?.nomeCompleto || "Parceiro não encontrado"
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        Nenhum
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(op)}
                      >
                        Ver detalhes
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditOperation(op)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteOperation(op)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Details Dialog */}
        <Dialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
        >
          <DialogContent className="sm:max-w-[450px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Detalhes da Operação {selectedOperation?.number}
              </DialogTitle>
              <DialogDescription>
                Informações detalhadas sobre a operação selecionada.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedOperation &&
                Object.entries(selectedOperation)
                  .filter(
                    ([key]) =>
                      key !== "id" && key !== "createdAt" && key !== "updatedAt"
                  )
                  .map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <Label className="font-bold text-sm">
                        {formatLabel(key)}
                      </Label>
                      <p className="text-sm">{formatValue(key, value)}</p>
                    </div>
                  ))}
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setIsDetailsDialogOpen(false)}
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  setIsDetailsDialogOpen(false);
                  handleEditOperation(selectedOperation!);
                }}
              >
                Editar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a operação{" "}
                {operationToDelete?.number}? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteOperation}
                className="bg-red-500 hover:bg-red-600"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
