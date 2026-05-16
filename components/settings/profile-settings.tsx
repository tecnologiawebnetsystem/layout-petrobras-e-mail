"use client"

import { useState } from "react"
import { Camera, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useNotificationStore } from "@/lib/stores/notification-store"

export function ProfileSettings() {
  const { user } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [phone, setPhone] = useState("")
  const [department, setDepartment] = useState("")

  const handleSave = () => {
    addNotification({
      type: "upload_success",
      priority: "low",
      title: "Perfil atualizado",
      message: "Suas informações foram atualizadas com sucesso",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informações do Perfil</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Atualize suas informações pessoais</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-[#0047BB] text-white text-2xl">
                {user?.name ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#00A99D] hover:bg-[#008a82]"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{user?.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
              Alterar foto
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@petrobras.com.br"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Seu departamento"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline">Cancelar</Button>
          <Button onClick={handleSave} className="bg-[#0047BB] hover:bg-[#003a99]">
            <Save className="h-4 w-4 mr-2" />
            Salvar alterações
          </Button>
        </div>
      </div>
    </Card>
  )
}
