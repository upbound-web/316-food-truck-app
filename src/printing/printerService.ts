/// <reference path="./webusb.d.ts" />

export type PrinterStatus = "disconnected" | "connecting" | "connected" | "error";

type StatusListener = (status: PrinterStatus) => void;

const PRINTER_CLASS_CODE = 0x07;

let device: USBDevice | null = null;
let outEndpoint: number | null = null;
let interfaceNumber: number | null = null;
let status: PrinterStatus = "disconnected";
const listeners = new Set<StatusListener>();

function setStatus(newStatus: PrinterStatus) {
  status = newStatus;
  listeners.forEach((fn) => fn(newStatus));
}

function findPrinterInterface(dev: USBDevice): { iface: number; endpoint: number } | null {
  for (const config of dev.configurations) {
    for (const iface of config.interfaces) {
      for (const alt of iface.alternates) {
        if (alt.interfaceClass === PRINTER_CLASS_CODE) {
          const outEp = alt.endpoints.find((e) => e.direction === "out");
          if (outEp) {
            return { iface: iface.interfaceNumber, endpoint: outEp.endpointNumber };
          }
        }
      }
    }
  }
  return null;
}

async function openDevice(dev: USBDevice): Promise<boolean> {
  try {
    setStatus("connecting");
    if (!dev.opened) {
      await dev.open();
    }
    if (dev.configuration === null) {
      await dev.selectConfiguration(1);
    }

    const match = findPrinterInterface(dev);
    if (!match) {
      console.error("No printer interface found on device");
      setStatus("error");
      return false;
    }

    await dev.claimInterface(match.iface);
    device = dev;
    outEndpoint = match.endpoint;
    interfaceNumber = match.iface;
    setStatus("connected");
    return true;
  } catch (err) {
    console.error("Failed to open printer:", err);
    setStatus("error");
    return false;
  }
}

export const printerService = {
  /** Opens Chrome's USB device picker. Requires a user gesture. */
  async pair(): Promise<boolean> {
    if (!navigator.usb) {
      console.error("WebUSB not supported");
      return false;
    }
    try {
      const selected = await navigator.usb.requestDevice({
        filters: [{ classCode: PRINTER_CLASS_CODE }],
      });
      return await openDevice(selected);
    } catch (err) {
      // User cancelled the picker or error
      if ((err as Error).name !== "NotFoundError") {
        console.error("Pair error:", err);
        setStatus("error");
      }
      return false;
    }
  },

  /** Reconnects to a previously paired printer (no user gesture needed). */
  async reconnect(): Promise<boolean> {
    if (!navigator.usb) return false;
    try {
      const devices = await navigator.usb.getDevices();
      const printer = devices.find((d) => findPrinterInterface(d) !== null);
      if (printer) {
        return await openDevice(printer);
      }
    } catch (err) {
      console.error("Reconnect error:", err);
    }
    return false;
  },

  /** Sends raw bytes to the printer. */
  async printRaw(data: Uint8Array): Promise<boolean> {
    if (!device || outEndpoint === null) {
      console.error("Printer not connected");
      return false;
    }
    try {
      const result = await device.transferOut(outEndpoint, data);
      return result.status === "ok";
    } catch (err) {
      console.error("Print error:", err);
      setStatus("error");
      device = null;
      outEndpoint = null;
      interfaceNumber = null;
      return false;
    }
  },

  /** Releases the USB interface and closes the device. */
  async disconnect(): Promise<void> {
    if (device) {
      try {
        if (interfaceNumber !== null) {
          await device.releaseInterface(interfaceNumber);
        }
        await device.close();
      } catch (err) {
        console.error("Disconnect error:", err);
      }
      device = null;
      outEndpoint = null;
      interfaceNumber = null;
    }
    setStatus("disconnected");
  },

  getStatus(): PrinterStatus {
    return status;
  },

  subscribe(listener: StatusListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
