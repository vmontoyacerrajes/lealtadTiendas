// src/EscanerQR.jsx
import { Html5Qrcode } from "html5-qrcode";
import { useEffect } from "react";

const EscanerQR = ({ onScanSuccess }) => {
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");

    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length) {
        const cameraId = devices[0].id;

        html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText, decodedResult) => {
            onScanSuccess(decodedText);
            html5QrCode.stop();
          },
          (errorMessage) => {
            console.warn("QR error:", errorMessage);
          }
        );
      }
    });

    return () => {
      html5QrCode.stop().catch((err) => console.error("Stop failed", err));
    };
  }, []);

  return <div id="reader" style={{ width: "100%" }} />;
};

export default EscanerQR;