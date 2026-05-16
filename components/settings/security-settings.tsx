"use client"

import { useState } from "react"
import { Eye, EyeOff, Save, Shield, Check, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNotificationStore } from "@/lib/stores/notification-store"

export function SecuritySettings() {
  const { addNotification } = useNotificationStore()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordRequirements = [
    { label: "Mínimo de 8 caracteres", met: newPassword.length >= 8 },
    { label: "Letras maiúsculas e minúsculas", met: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) },
    { label: "Pelo menos um número", met: /\d/.test(newPassword) },
    { label: "Caractere especial (!@#$%)", met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
  ]

  const isPasswordValid = passwordRequirements.every((req) => req.met)
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== ""

  const handleSave = () => {
    if (!isPasswordValid) {
      addNotification({
        type: "security_alert",
        priority: "high",
        title: "Senha inválida",
        message: "A senha não atende aos requisitos de segurança",
      })
      return
    }

    if (!passwordsMatch) {
      addNotification({
        type: "security_alert",
        priority: "high",
        title: "Senhas não coincidem",
        message: "A nova senha e a confirmação devem ser iguais",
      })
      return
    }

    addNotification({
      type: "approval_approved",
      priority: "medium",
      title: "Senha alterada",
      message: "Sua senha foi atualizada com sucesso",
    })

    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Alterar Senha</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Mantenha sua conta segura com uma senha forte
            </p>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Senha atual</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {newPassword && (
              <div className="space-y-2 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Requisitos de senha:</p>
                <div className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {req.met ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-gray-400" />}
                      <span className={req.met ? "text-green-600" : "text-gray-600 dark:text-gray-400"}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline">Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={!isPasswordValid || !passwordsMatch || !currentPassword}
              className="bg-[#0047BB] hover:bg-[#003a99]"
            >
              <Save className="h-4 w-4 mr-2" />
              Alterar senha
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white">Autenticação de dois fatores (2FA)</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Adicione uma camada extra de segurança à sua conta
            </p>
            <Button variant="outline" className="mt-3 bg-transparent">
              Configurar 2FA
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
