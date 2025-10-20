"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PaymentDetails = {
  cardNumber: string
  cardHolder: string
  expiryDate: string
  cvv: string
}

type PaymentFormProps = {
  paymentDetails: PaymentDetails
  setPaymentDetails: React.Dispatch<React.SetStateAction<PaymentDetails>>
  onSubmit: (e: React.FormEvent) => void
  isProcessing: boolean
}

export function PaymentForm({ paymentDetails, setPaymentDetails, onSubmit, isProcessing }: PaymentFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Format card number with spaces
    if (name === "cardNumber") {
      const formatted = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim()
      setPaymentDetails((prev) => ({ ...prev, [name]: formatted }))
      return
    }

    // Format expiry date with slash
    if (name === "expiryDate") {
      const cleaned = value.replace(/\D/g, "")
      let formatted = cleaned
      if (cleaned.length > 2) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
      }
      setPaymentDetails((prev) => ({ ...prev, [name]: formatted }))
      return
    }

    setPaymentDetails((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cardNumber">Kart Numarası</Label>
        <Input
          id="cardNumber"
          name="cardNumber"
          placeholder="1234 5678 9012 3456"
          value={paymentDetails.cardNumber}
          onChange={handleChange}
          maxLength={19}
          disabled={isProcessing}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardHolder">Kart Sahibi</Label>
        <Input
          id="cardHolder"
          name="cardHolder"
          placeholder="Ad Soyad"
          value={paymentDetails.cardHolder}
          onChange={handleChange}
          disabled={isProcessing}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiryDate">Son Kullanma Tarihi</Label>
          <Input
            id="expiryDate"
            name="expiryDate"
            placeholder="MM/YY"
            value={paymentDetails.expiryDate}
            onChange={handleChange}
            maxLength={5}
            disabled={isProcessing}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            name="cvv"
            placeholder="123"
            value={paymentDetails.cvv}
            onChange={handleChange}
            maxLength={3}
            disabled={isProcessing}
            required
          />
        </div>
      </div>
    </form>
  )
}
