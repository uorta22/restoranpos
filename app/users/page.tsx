"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { EmptyState } from "@/components/empty-state"
import { Plus } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Trash2, UserPlus, Mail, Key, Shield } from "lucide-react"
import type { User } from "@/lib/types"

export default function UsersPage() {
  const { user, isLoading, register } = useAuth()
  const router = useRouter()
  const [showSidebar, setShowSidebar] = useState(true)
  const [users, setUsers] = useState<any[]>([]) // API'den gelecek
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Garson" as User["role"],
  })
  const { toast } = useToast()

  // Responsive sidebar kontrolü
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Kullanıcıları yükle - API'den gelecek
  useEffect(() => {
    // TODO: API'den kullanıcıları yükle
    // fetchUsers()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const handleAddFirstUser = () => {
    setIsAddUserOpen(true)
  }

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen tüm zorunlu alanları doldurun.",
        variant: "destructive",
      })
      return
    }

    if (userForm.password !== userForm.confirmPassword) {
      toast({
        title: "Şifreler eşleşmiyor",
        description: "Girdiğiniz şifreler eşleşmiyor.",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await register(userForm.name, userForm.email, userForm.password, userForm.role)

      if (result.success) {
        // Yeni kullanıcıyı listeye ekle
        const newUser: User = {
          id: Math.random().toString(36).substring(2, 9),
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          avatar: "/placeholder.svg?height=40&width=40",
        }

        setUsers([...users, newUser])
        setIsAddUserOpen(false)

        // Formu temizle
        setUserForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "Garson",
        })

        toast({
          title: "Kullanıcı eklendi",
          description: `${userForm.name} başarıyla eklendi.`,
        })
      } else {
        toast({
          title: "Hata",
          description: result.message || "Kullanıcı eklenirken bir hata oluştu.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kullanıcı eklenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = (user: User) => {
    setCurrentUser(user)
    setUserForm({
      name: user.name,
      email: user.email,
      password: "",
      confirmPassword: "",
      role: user.role,
    })
    setIsEditUserOpen(true)
  }

  const handleUpdateUser = () => {
    if (!currentUser) return

    const updatedUsers = users.map((u) =>
      u.id === currentUser.id ? { ...u, name: userForm.name, email: userForm.email, role: userForm.role } : u,
    )

    setUsers(updatedUsers)
    setIsEditUserOpen(false)

    toast({
      title: "Kullanıcı güncellendi",
      description: `${userForm.name} başarıyla güncellendi.`,
    })
  }

  const handleDeleteUser = (id: string, name: string) => {
    setUsers(users.filter((u) => u.id !== id))

    toast({
      title: "Kullanıcı silindi",
      description: `${name} başarıyla silindi.`,
    })
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
            <Button onClick={handleAddFirstUser}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kullanıcı
            </Button>
          </div>

          {users.length === 0 ? (
            <EmptyState
              type="users"
              title="Henüz kullanıcı yok"
              description="Sisteme yeni kullanıcılar ekleyerek ekip yönetimini başlatın."
              onAction={handleAddFirstUser}
              actionLabel="İlk Kullanıcıyı Ekle"
            />
          ) : (
            <div>
              <div className="mb-6">
                <Input
                  placeholder="Kullanıcı ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                  <Card key={user.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{user.name}</CardTitle>
                        <div className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100">{user.role}</div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">ID: {user.id}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Kullanıcı Adı
              </Label>
              <Input
                id="name"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="Kullanıcı adını girin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-posta
              </Label>
              <Input
                id="email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="E-posta adresini girin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Şifre
              </Label>
              <Input
                id="password"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Şifre girin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Şifre Tekrar
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={userForm.confirmPassword}
                onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                placeholder="Şifreyi tekrar girin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Rol
              </Label>
              <Select
                value={userForm.role}
                onValueChange={(value) => setUserForm({ ...userForm, role: value as User["role"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yönetici">Yönetici</SelectItem>
                  <SelectItem value="Garson">Garson</SelectItem>
                  <SelectItem value="Şef">Şef</SelectItem>
                  <SelectItem value="Kasiyer">Kasiyer</SelectItem>
                  <SelectItem value="Kurye">Kurye</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAddUser}>Kullanıcı Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcı Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Kullanıcı Adı
              </Label>
              <Input
                id="edit-name"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="Kullanıcı adını girin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-posta
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="E-posta adresini girin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Rol
              </Label>
              <Select
                value={userForm.role}
                onValueChange={(value) => setUserForm({ ...userForm, role: value as User["role"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yönetici">Yönetici</SelectItem>
                  <SelectItem value="Garson">Garson</SelectItem>
                  <SelectItem value="Şef">Şef</SelectItem>
                  <SelectItem value="Kasiyer">Kasiyer</SelectItem>
                  <SelectItem value="Kurye">Kurye</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleUpdateUser}>Değişiklikleri Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
