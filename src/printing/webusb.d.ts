interface USBDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
}

interface USBDeviceRequestOptions {
  filters: USBDeviceFilter[];
}

interface USBDevice {
  vendorId: number;
  productId: number;
  productName: string;
  manufacturerName: string;
  serialNumber: string;
  opened: boolean;
  configuration: USBConfiguration | null;
  configurations: USBConfiguration[];
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(
    endpointNumber: number,
    data: BufferSource
  ): Promise<USBOutTransferResult>;
}

interface USBConfiguration {
  configurationValue: number;
  interfaces: USBInterface[];
}

interface USBInterface {
  interfaceNumber: number;
  alternate: USBAlternateInterface;
  alternates: USBAlternateInterface[];
}

interface USBAlternateInterface {
  interfaceClass: number;
  endpoints: USBEndpoint[];
}

interface USBEndpoint {
  endpointNumber: number;
  direction: "in" | "out";
  type: "bulk" | "interrupt" | "isochronous";
}

interface USBOutTransferResult {
  bytesWritten: number;
  status: "ok" | "stall" | "babble";
}

interface USB {
  getDevices(): Promise<USBDevice[]>;
  requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>;
  addEventListener(
    type: "connect" | "disconnect",
    listener: (event: USBConnectionEvent) => void
  ): void;
  removeEventListener(
    type: "connect" | "disconnect",
    listener: (event: USBConnectionEvent) => void
  ): void;
}

interface USBConnectionEvent extends Event {
  device: USBDevice;
}

interface Navigator {
  usb?: USB;
}
