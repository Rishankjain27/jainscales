import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, CheckCircle2 } from "lucide-react";

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [scannedValue, setScannedValue] = useState("");

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("scanner", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: [0, 1] // Both QR and Barcode
    });

    scanner.render(
      (decodedText) => {
        setScannedValue(decodedText);
        scanner.clear();
        onScan(decodedText);
      },
      (error) => {
        // Ignore errors during scanning
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [onScan]);

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          <CardTitle>Scan Barcode / QR Code</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent>
        <div id="scanner" className="rounded-lg overflow-hidden"></div>
        {scannedValue && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Scanned: {scannedValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
