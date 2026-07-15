"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Edit, Mail, Plus, Shield, Trash2, UserPlus } from "lucide-react"
import type { MemberRole } from "@/lib/database.types"
import { membersApi, type RestaurantMember } from "@/lib/api"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"

const roleLabels: Record<MemberRole, string> = {
  owner: "İşletme sahibi",
  manager: "Yönetici",
  cashier: "Kasiyer",
  waiter: "Garson",
  kitchen: "Mutfak",
  courier: "Kurye",
}

export default function TeamPage() {
  const { user, isLoading: isAuthLoading, refreshUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [showSidebar, setShowSidebar] = useState(true)
  const [members, setMembers] = useState<RestaurantMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<MemberRole>("waiter")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [editingMember, setEditingMember] = useState<RestaurantMember | null>(null)
  const [editingRole, setEditingRole] = useState<MemberRole>("waiter")
  const [removingMember, setRemovingMember] = useState<RestaurantMember | null>(null)

  const isOwner = user?.memberRole === "owner"
  const canManage = isOwner || user?.memberRole === "manager"

  const loadMembers = useCallback(async () => {
    if (!user?.restaurant_id) return
    setIsLoading(true)
    try {
      setMembers(await membersApi.getAll())
    } catch (cause) {
      toast({
        title: "Ekip yüklenemedi",
        description: cause instanceof Error ? cause.message : "Ekip bilgileri okunamadı.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, user?.restaurant_id])

  useEffect(() => {
    const handleResize = () => setShowSidebar(window.innerWidth >= 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadMembers(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadMembers])

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("tr-TR")
    if (!query) return members
    return members.filter((member) =>
      [member.name, member.email, roleLabels[member.role]].some((value) =>
        value.toLocaleLowerCase("tr-TR").includes(query),
      ),
    )
  }, [members, searchQuery])

  const createInvitation = async () => {
    if (!inviteEmail.trim()) return
    setIsSubmitting(true)
    try {
      const invitation = await membersApi.createInvitation(inviteEmail, inviteRole)
      setInvitationUrl(`${window.location.origin}/invite/${invitation.token}`)
      toast({ title: "Davet oluşturuldu", description: "Bağlantıyı ekip üyesiyle güvenli biçimde paylaşın." })
    } catch (cause) {
      toast({
        title: "Davet oluşturulamadı",
        description: cause instanceof Error ? cause.message : "Davet işlemi tamamlanamadı.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyInvitation = async () => {
    if (!invitationUrl) return
    await navigator.clipboard.writeText(invitationUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const closeInvitation = () => {
    setIsInviteOpen(false)
    setInviteEmail("")
    setInviteRole("waiter")
    setInvitationUrl(null)
    setCopied(false)
  }

  const updateMemberRole = async () => {
    if (!editingMember) return
    setIsSubmitting(true)
    try {
      await membersApi.updateRole(editingMember.id, editingRole)
      setEditingMember(null)
      await loadMembers()
      if (editingMember.id === user?.id) await refreshUser()
      toast({ title: "Rol güncellendi", description: `${editingMember.name} için yeni rol kaydedildi.` })
    } catch (cause) {
      toast({
        title: "Rol güncellenemedi",
        description: cause instanceof Error ? cause.message : "Rol değişikliği tamamlanamadı.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeMember = async () => {
    if (!removingMember) return
    setIsSubmitting(true)
    try {
      await membersApi.remove(removingMember.id)
      toast({ title: "Üye kaldırıldı", description: `${removingMember.name} ekipten kaldırıldı.` })
      setRemovingMember(null)
      await loadMembers()
    } catch (cause) {
      toast({
        title: "Üye kaldırılamadı",
        description: cause instanceof Error ? cause.message : "Üye kaldırma işlemi tamamlanamadı.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canRemoveMember = (member: RestaurantMember) => {
    if (member.id === user?.id) return false
    if (isOwner) return true
    return user?.memberRole === "manager" && member.role !== "owner" && member.role !== "manager"
  }

  if (isAuthLoading || isLoading) {
    return (
      <div className="grid h-screen place-items-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
      </div>
    )
  }

  if (!user) {
    router.replace("/login")
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-950">Ekip Yönetimi</h1>
              <p className="mt-1 text-sm text-gray-500">Rolleri ve restoran erişimlerini yönetin.</p>
            </div>
            {canManage && (
              <Button onClick={() => setIsInviteOpen(true)}>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Üye davet et
              </Button>
            )}
          </div>

          <Input
            aria-label="Ekipte ara"
            placeholder="Ad, e-posta veya rol ara"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="mb-5 max-w-md"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => (
              <Card key={member.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{member.name}</CardTitle>
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {roleLabels[member.role]}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} alt="" />
                      <AvatarFallback>{member.name.charAt(0).toLocaleUpperCase("tr-TR")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-gray-600">{member.email}</p>
                      {member.id === user.id && <p className="mt-1 text-xs font-medium text-orange-700">Siz</p>}
                    </div>
                  </div>
                </CardContent>
                {(isOwner || canRemoveMember(member)) && (
                  <CardFooter className="justify-end gap-2">
                    {isOwner && (
                      <Button
                        variant="outline"
                        size="icon"
                        title="Rolü düzenle"
                        onClick={() => {
                          setEditingMember(member)
                          setEditingRole(member.role)
                        }}
                      >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                    {canRemoveMember(member) && (
                      <Button
                        variant="outline"
                        size="icon"
                        title="Üyeyi kaldır"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setRemovingMember(member)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </main>
      </div>

      <Dialog open={isInviteOpen} onOpenChange={(open) => (open ? setIsInviteOpen(true) : closeInvitation())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{invitationUrl ? "Davet bağlantısı" : "Ekip üyesi davet et"}</DialogTitle>
          </DialogHeader>
          {invitationUrl ? (
            <div className="space-y-4 py-3">
              <p className="text-sm text-gray-600">Bu bağlantı yedi gün geçerli ve yalnızca davet edilen e-posta ile kullanılabilir.</p>
              <div className="flex gap-2">
                <Input value={invitationUrl} readOnly aria-label="Davet bağlantısı" />
                <Button type="button" size="icon" title="Bağlantıyı kopyala" onClick={copyInvitation}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-3">
              <div className="space-y-2">
                <Label htmlFor="invite-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  E-posta
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" aria-hidden="true" />
                  Rol
                </Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as MemberRole)}>
                  <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {isOwner && <SelectItem value="manager">Yönetici</SelectItem>}
                    <SelectItem value="cashier">Kasiyer</SelectItem>
                    <SelectItem value="waiter">Garson</SelectItem>
                    <SelectItem value="kitchen">Mutfak</SelectItem>
                    <SelectItem value="courier">Kurye</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeInvitation}>{invitationUrl ? "Kapat" : "İptal"}</Button>
            {!invitationUrl && (
              <Button onClick={createInvitation} disabled={isSubmitting || !inviteEmail.trim()}>
                <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                {isSubmitting ? "Oluşturuluyor..." : "Davet oluştur"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingMember)} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Üye rolünü düzenle</DialogTitle></DialogHeader>
          <div className="space-y-2 py-3">
            <Label htmlFor="member-role">{editingMember?.name}</Label>
            <Select value={editingRole} onValueChange={(value) => setEditingRole(value as MemberRole)}>
              <SelectTrigger id="member-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">İşletme sahibi</SelectItem>
                <SelectItem value="manager">Yönetici</SelectItem>
                <SelectItem value="cashier">Kasiyer</SelectItem>
                <SelectItem value="waiter">Garson</SelectItem>
                <SelectItem value="kitchen">Mutfak</SelectItem>
                <SelectItem value="courier">Kurye</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>İptal</Button>
            <Button onClick={updateMemberRole} disabled={isSubmitting}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(removingMember)} onOpenChange={(open) => !open && setRemovingMember(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Üyeyi ekipten kaldır</DialogTitle></DialogHeader>
          <p className="py-3 text-sm text-gray-600">
            {removingMember?.name} restoran verilerine erişimini hemen kaybedecek.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovingMember(null)}>Vazgeç</Button>
            <Button variant="destructive" onClick={removeMember} disabled={isSubmitting}>Üyeyi kaldır</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
