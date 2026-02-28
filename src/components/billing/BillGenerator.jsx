import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, MessageCircle } from "lucide-react";
import { format } from "date-fns";

const COMPANY = {
  name: "JAIN SCALES",
  tagline: "Dealer of Weighing Instruments",
  gstin: "23XXXXX1234X1ZX",
  address: "Khandwa, Madhya Pradesh",
  mobile: "+91-XXXXXXXXXX",
};

const getCapNum = (cap) => {
  if (!cap) return null;
  if (typeof cap === "number") return cap;
  const num = Number(String(cap).replace(/[^0-9]/g, ""));
  return isNaN(num) ? null : num;
};

async function generateBillPDF(serial, otherCharges, advance) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PW = 210, M = 10, CW = 190;
  let y = 0;

  // Header
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, PW, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22); doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, PW / 2, 13, { align: "center" });
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(COMPANY.tagline, PW / 2, 20, { align: "center" });
  doc.setFontSize(8);
  doc.text(`GSTIN: ${COMPANY.gstin}  |  ${COMPANY.address}  |  Mobile: ${COMPANY.mobile}`, PW / 2, 28, { align: "center" });

  y = 44;
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("INVOICE", PW / 2, y, { align: "center" });
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.5);
  doc.line(M, y + 2, PW - M, y + 2);

  y = 53;
  // Bill info box
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(147, 197, 253);
  doc.setLineWidth(0.3);
  doc.rect(M, y, CW, 28, "FD");

  doc.setTextColor(0); doc.setFontSize(9);
  const L1 = M + 4, L2 = PW / 2 + 4;

  const infoRows = [
    ["Bill Book No:", serial.bill_book_number || "-", "Bill No:", serial.bill_number || "-"],
    ["Customer:", serial.customer_name || "-", "Date:", serial.sale_date ? format(new Date(serial.sale_date), "dd/MM/yyyy") : "-"],
    ["Mobile:", serial.customer_mobile || "-", "", ""],
  ];
  infoRows.forEach((row, i) => {
    const ry = y + 7 + i * 8;
    doc.setFont("helvetica", "bold"); doc.text(row[0], L1, ry);
    doc.setFont("helvetica", "normal"); doc.text(row[1], L1 + (row[0].length > 8 ? 22 : 18), ry);
    if (row[2]) {
      doc.setFont("helvetica", "bold"); doc.text(row[2], L2, ry);
      doc.setFont("helvetica", "normal"); doc.text(row[3], L2 + (row[2].length > 8 ? 22 : 14), ry);
    }
  });

  y += 36;

  // Table
  const COLS = [10, 20, 62, 90, 113, 153, 163, 182];
  const HDRS = ["S.No", "Description", "Model", "Capacity", "Serial No.", "Qty", "Rate", "Total"];
  doc.setFillColor(30, 64, 175);
  doc.rect(M, y, CW, 8, "F");
  doc.setTextColor(255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  HDRS.forEach((h, i) => doc.text(h, COLS[i] + 1, y + 5.5));

  y += 8;
  doc.setTextColor(0); doc.setFont("helvetica", "normal");
  doc.setFillColor(249, 250, 251); doc.setDrawColor(220);
  doc.rect(M, y, CW, 10, "FD");

  const cap = getCapNum(serial.capacity);
  const price = Number(serial.selling_price || 0);
  const ROW = ["1", "Weighing Scale", serial.model || "-", cap ? `${cap} kg` : "-", serial.serial_number || "-", "1", `Rs.${price.toLocaleString()}`, `Rs.${price.toLocaleString()}`];
  ROW.forEach((d, i) => doc.text(String(d), COLS[i] + 1, y + 6.5));

  y += 18;

  // Totals
  const oc = Number(otherCharges) || 0;
  const adv = Number(advance) || 0;
  const bal = price + oc - adv;
  const TX = 128, VX = 198;

  [["Total Goods Value:", `Rs.${price.toLocaleString()}`], ["Other Charges:", `Rs.${oc.toLocaleString()}`], ["Advance Received:", `Rs.${adv.toLocaleString()}`]].forEach(([label, val]) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(label, TX, y);
    doc.text(val, VX, y, { align: "right" });
    y += 7;
  });

  doc.setFillColor(30, 64, 175);
  doc.rect(TX - 3, y - 1, 73, 9, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold");
  doc.text("Balance Amount:", TX, y + 5.5);
  doc.text(`Rs.${bal.toLocaleString()}`, VX, y + 5.5, { align: "right" });

  y += 15; doc.setTextColor(0);

  // Bank + Terms
  const hw = (CW - 5) / 2;
  doc.setFillColor(248, 250, 252); doc.setDrawColor(210); doc.setLineWidth(0.3);
  doc.rect(M, y, hw, 24, "FD");
  doc.rect(M + hw + 5, y, hw, 24, "FD");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.text("Bank Details:", M + 3, y + 7);
  doc.setFont("helvetica", "normal");
  doc.text("Canara Bank", M + 3, y + 12);
  doc.text("IFSC: CNRB0002546  |  Branch: Khandwa", M + 3, y + 17);

  const T2 = M + hw + 8;
  doc.setFont("helvetica", "bold"); doc.text("Terms & Conditions:", T2, y + 7);
  doc.setFont("helvetica", "normal");
  doc.text("18% interest will be charged after 15 days.", T2, y + 12);
  doc.text("Goods once sold will not be taken back.", T2, y + 17);

  // Footer
  const PH = 297;
  doc.setDrawColor(30, 64, 175); doc.setLineWidth(0.5);
  doc.line(M, PH - 15, PW - M, PH - 15);
  doc.setTextColor(120); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Jain Scales, Khandwa  |  Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}  |  Computer Generated Invoice`, PW / 2, PH - 10, { align: "center" });

  doc.save(`Bill_${serial.bill_number || serial.serial_number}_${format(new Date(), "yyyyMMdd")}.pdf`);
}

export default function BillGenerator({ serial, onClose }) {
  const [otherCharges, setOtherCharges] = useState("");
  const [advance, setAdvance] = useState("");
  const [generating, setGenerating] = useState(false);

  const price = Number(serial?.selling_price || 0);
  const oc = Number(otherCharges) || 0;
  const adv = Number(advance) || 0;
  const balance = price + oc - adv;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateBillPDF(serial, otherCharges, advance);
    } catch (err) {
      console.error("PDF error:", err);
    }
    setGenerating(false);
  };

  const handleWhatsApp = () => {
    const saleDate = serial.sale_date ? format(new Date(serial.sale_date), "dd/MM/yyyy") : "-";
    const msg = `*JAIN SCALES - INVOICE*\n*Dealer of Weighing Instruments, Khandwa*\n\n` +
      `Bill Book No: ${serial.bill_book_number || "-"}\nBill No: ${serial.bill_number || "-"}\nDate: ${saleDate}\n\n` +
      `*Customer:* ${serial.customer_name || "-"}\nMobile: ${serial.customer_mobile || "-"}\n\n` +
      `*Item Details:*\nModel: ${serial.model || "-"}\nCapacity: ${serial.capacity ? serial.capacity + " kg" : "-"}\n` +
      `Serial No: ${serial.serial_number}\n\n` +
      `Amount: Rs.${price.toLocaleString()}\nOther Charges: Rs.${oc.toLocaleString()}\n` +
      `Advance: Rs.${adv.toLocaleString()}\n*Balance: Rs.${balance.toLocaleString()}*\n\n` +
      `Warranty: 1 Year from ${saleDate}\n\n_Thank you for your purchase!_`;

    const phone = (serial.customer_mobile || "").replace(/[^0-9]/g, "");
    const url = phone.length === 10
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Generate Bill
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Serial:</span><span className="font-mono font-semibold">{serial?.serial_number}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Customer:</span><span className="font-medium">{serial?.customer_name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Amount:</span><span className="font-medium">Rs.{price.toLocaleString()}</span></div>
          </div>
          <div>
            <Label>Other Charges (Rs.)</Label>
            <Input type="number" value={otherCharges} onChange={e => setOtherCharges(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>Advance Received (Rs.)</Label>
            <Input type="number" value={advance} onChange={e => setAdvance(e.target.value)} placeholder="0" />
          </div>
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
            <div className="flex justify-between font-bold text-blue-900">
              <span>Balance Amount:</span>
              <span>Rs.{balance.toLocaleString()}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleGenerate} disabled={generating} className="bg-blue-600 hover:bg-blue-700">
              <FileText className="w-4 h-4 mr-2" />
              {generating ? "Generating..." : "Download PDF"}
            </Button>
            <Button onClick={handleWhatsApp} variant="outline" className="text-green-700 border-green-300 hover:bg-green-50">
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
