import { useEffect, useState, useCallback } from "react";
import { printerService, PrinterStatus } from "./printerService";
import { encodeReceipt, ReceiptOrder } from "./receiptEncoder";

export function usePrinter() {
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>(
    printerService.getStatus()
  );

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = printerService.subscribe(setPrinterStatus);

    // Attempt auto-reconnect on mount
    if (printerService.getStatus() === "disconnected") {
      printerService.reconnect();
    }

    return unsubscribe;
  }, []);

  const pair = useCallback(async () => {
    return printerService.pair();
  }, []);

  const disconnect = useCallback(async () => {
    return printerService.disconnect();
  }, []);

  const printOrder = useCallback(async (order: ReceiptOrder): Promise<boolean> => {
    const data = encodeReceipt(order);
    return printerService.printRaw(data);
  }, []);

  return {
    printerStatus,
    isConnected: printerStatus === "connected",
    pair,
    disconnect,
    printOrder,
  };
}
