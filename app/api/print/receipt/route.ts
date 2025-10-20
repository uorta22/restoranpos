import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Sipariş ID gerekli" }, { status: 400 })
    }

    // Bu örnekte basit bir HTML receipt döndürüyoruz
    // Gerçek uygulamada burada veritabanından sipariş bilgilerini alıp
    // profesyonel bir fiş formatı oluşturabilirsiniz
    const receiptHtml = `
      <div style="font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto;">
        <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">
          RESTAURANT POS
        </div>
        <div style="text-align: center; margin-bottom: 20px;">
          Sipariş Fişi #${orderId.slice(-6)}
        </div>
        <div style="margin-bottom: 10px;">
          Tarih: ${new Date().toLocaleString("tr-TR")}
        </div>
        <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
        <div style="text-align: center; font-size: 12px; margin-top: 20px;">
          Bizi tercih ettiğiniz için teşekkür ederiz!<br>
          www.restaurantpos.com
        </div>
      </div>
    `

    return NextResponse.json({
      success: true,
      receipt: {
        html: receiptHtml,
      },
    })
  } catch (error) {
    console.error("Receipt API error:", error)
    return NextResponse.json({ success: false, error: "Fiş oluşturulurken bir hata oluştu" }, { status: 500 })
  }
}
