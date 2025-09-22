"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { FileSpreadsheet, FileText, FileIcon as FilePdf, Calendar, Mail } from "lucide-react"

interface ReportExportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportType: "sales" | "orders" | "inventory" | "summary"
}

export function ReportExport({ open, onOpenChange, reportType }: ReportExportProps) {
  const { toast } = useToast()
  const [format, setFormat] = useState<"csv" | "xlsx" | "pdf">("xlsx")
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })
  const [sendEmail, setSendEmail] = useState(false)
  const [emailAddress, setEmailAddress] = useState("")
  const [scheduleReport, setScheduleReport] = useState(false)
  const [scheduleFrequency, setScheduleFrequency] = useState<"daily" | "weekly" | "monthly">("monthly")

  const formatTitles = {
    csv: "CSV (Comma Separated Values)",
    xlsx: "Excel (.xlsx)",
    pdf: "PDF Dokümanı",
  }

  const reportTitles = {
    sales: "Satış Raporu",
    orders: "Sipariş Raporu",
    inventory: "Envanter Raporu",
    summary: "Özet Rapor",
  }

  const handleExport = () => {
    toast({
      title: "Rapor indiriliyor",
      description: `${reportTitles[reportType]} ${format.toUpperCase()} formatında indiriliyor.`,
    })
    onOpenChange(false)

    // In a real app, you would generate and download the report here
    setTimeout(() => {
      toast({
        title: "Rapor hazır",
        description: "Rapor başarıyla hazırlandı ve indirildi.",
      })
    }, 1500)
  }

  const handleSchedule = () => {
    if (scheduleReport && !emailAddress) {
      toast({
        title: "E-posta adresi gerekli",
        description: "Planlı raporlar için e-posta adresi gereklidir.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Rapor planlandı",
      description: `${reportTitles[reportType]} ${scheduleFrequency} olarak planlandı.`,
    })
    onOpenChange(false)
  }

  const getFormatIcon = () => {
    switch (format) {
      case "csv":
        return <FileText className="h-5 w-5 mr-2" />
      case "xlsx":
        return <FileSpreadsheet className="h-5 w-5 mr-2" />
      case "pdf":
        return <FilePdf className="h-5 w-5 mr-2" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{reportTitles[reportType]} Dışa Aktar</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="space-y-4">
            <Label>Tarih Aralığı</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date" className="text-xs">
                  Başlangıç
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-xs">
                  Bitiş
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Dışa Aktarma Formatı</Label>
            <div className="grid grid-cols-3 gap-4">
              {(["csv", "xlsx", "pdf"] as const).map((formatOption) => (
                <Button
                  key={formatOption}
                  type="button"
                  variant={format === formatOption ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-20 w-full"
                  onClick={() => setFormat(formatOption)}
                >
                  {formatOption === "csv" && <FileText className="h-8 w-8 mb-2" />}
                  {formatOption === "xlsx" && <FileSpreadsheet className="h-8 w-8 mb-2" />}
                  {formatOption === "pdf" && <FilePdf className="h-8 w-8 mb-2" />}
                  <span className="text-xs">{formatOption.toUpperCase()}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="send-email">E-posta ile Gönder</Label>
              <Switch id="send-email" checked={sendEmail} onCheckedChange={setSendEmail} />
            </div>

            {sendEmail && (
              <Input
                type="email"
                placeholder="E-posta adresi"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="schedule-report">Raporu Planla</Label>
              <Switch id="schedule-report" checked={scheduleReport} onCheckedChange={setScheduleReport} />
            </div>

            {scheduleReport && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="email-address">E-posta Adresi</Label>
                  <Input
                    id="email-address"
                    type="email"
                    placeholder="Rapor alıcısının e-posta adresi"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="schedule-frequency">Sıklık</Label>
                  <select
                    id="schedule-frequency"
                    value={scheduleFrequency}
                    onChange={(e) => setScheduleFrequency(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="daily">Günlük</option>
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
            {scheduleReport && (
              <Button onClick={handleSchedule}>
                <Calendar className="mr-2 h-4 w-4" />
                Planla
              </Button>
            )}
            {sendEmail && !scheduleReport && (
              <Button onClick={handleExport}>
                <Mail className="mr-2 h-4 w-4" />
                E-posta ile Gönder
              </Button>
            )}
            <Button onClick={handleExport}>
              {getFormatIcon()}
              {format.toUpperCase()} İndir
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
