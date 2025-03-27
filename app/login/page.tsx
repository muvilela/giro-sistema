"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Lock, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Smooch_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebaseConfig"; // ajuste o caminho conforme sua estrutura

const smoochSans = Smooch_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [recoveryData, setRecoveryData] = useState({
    email: "",
    username: "",
  });

  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (formData.email && formData.password) {
      try {
        // Autenticação com Firebase
        await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        // Redireciona para o dashboard após o login bem-sucedido
        router.push("/dashboard");
      } catch (error: any) {
        let errorMsg = "Erro ao fazer login. Tente novamente.";
        switch (error.code) {
          case "auth/wrong-password":
          case "auth/invalid-credential":
          case "auth/user-not-found":
            errorMsg = "Senha ou Usuário incorreto.";
            break;
          default:
            errorMsg = error.message || "Erro ao fazer login. Tente novamente.";
            break;
        }
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Por favor, preencha todos os campos");
      setIsLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    // Para recuperação, somente o e-mail é necessário
    if (recoveryData.email) {
      try {
        // Envia o e-mail de recuperação usando Firebase
        await sendPasswordResetEmail(auth, recoveryData.email);
        alert("E-mail de recuperação enviado!");
        setIsRecoveryMode(false);
      } catch (error: any) {
        setError(error.message || "Erro ao recuperar senha. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Por favor, preencha o e-mail");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="w-full max-w-[1200px] bg-white rounded-[32px] shadow-lg flex flex-col lg:flex-row p-8 gap-8">
        {/* Left side - Forms */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="max-w-md">
            <div
              className={cn(
                "transition-all duration-300 transform",
                isRecoveryMode
                  ? "translate-x-[-100%] absolute opacity-0"
                  : "translate-x-0 relative opacity-100"
              )}
            >
              <h1
                className={`text-[#000044] text-8xl mb-2 ${smoochSans.className} font-bold`}
              >
                Bem-Vindo!
              </h1>
              <p className="text-[#000044] mb-8 font-bold">
                Realize seu login e veja suas operações
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <Input
                    type="email"
                    placeholder="Email"
                    className="bg-[#f5f5f5] border-0 h-12 pl-10 text-black"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <Input
                    type="password"
                    placeholder="Senha"
                    className="bg-[#f5f5f5] border-0 h-12 pl-10 text-black"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#FFA500] hover:bg-[#FF8C00] text-white rounded-md font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </div>
                  ) : (
                    "Entrar"
                  )}
                </Button>
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setIsRecoveryMode(true)}
                    className={`${smoochSans.className} font-semibold text-xl text-[#000080] hover:underline`}
                  >
                    Esqueci a senha
                  </button>
                </div>
              </form>
            </div>

            {/* Recovery Form */}
            <div
              className={cn(
                "transition-all duration-300 transform",
                isRecoveryMode
                  ? "translate-x-0 relative opacity-100"
                  : "translate-x-[100%] absolute opacity-0"
              )}
            >
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setIsRecoveryMode(false)}
                  className="text-[#000080] hover:text-[#000080]/80 mr-4"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <h1
                  className={`text-[#000080] text-5xl ${smoochSans.className} font-bold`}
                >
                  Recuperar Senha
                </h1>
              </div>
              <p
                className={`text-[#000000] mb-4 font-bold ${smoochSans.className} text-sm`}
              >
                Digite seu email para recuperar sua senha
              </p>

              <form onSubmit={handleRecovery} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <Input
                    type="email"
                    placeholder="Email"
                    className="bg-[#f5f5f5] border-0 h-12 pl-10 text-black"
                    value={recoveryData.email}
                    onChange={(e) =>
                      setRecoveryData({
                        ...recoveryData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                {/* O campo "usuário" é opcional, pois o Firebase utiliza apenas o e-mail */}
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Usuário"
                    className="bg-[#f5f5f5] border-0 h-12 pl-10 text-black"
                    value={recoveryData.username}
                    onChange={(e) =>
                      setRecoveryData({
                        ...recoveryData,
                        username: e.target.value,
                      })
                    }
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#FFA500] hover:bg-[#FF8C00] text-white font-bold rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </div>
                  ) : (
                    "Recuperar Senha"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Right side - Logo */}
        <div className="flex-1 flex items-center justify-center">
          <Image
            src="/img/giro_logo.png"
            alt="Giro Capital Logo"
            width={500}
            height={150}
            className="max-w-full h-auto"
            priority
          />
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-[#FFA500] animate-spin mb-3" />
            <p className="text-[#000044] font-bold">Carregando...</p>
          </div>
        </div>
      )}
    </div>
  );
}
