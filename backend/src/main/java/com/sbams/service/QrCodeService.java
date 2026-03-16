package com.sbams.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.sbams.model.Asset;
import com.sbams.model.AssetAssignment;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Service
public class QrCodeService {

    private static final int QR_SIZE = 250;

    public String generateForAsset(Asset asset, AssetAssignment activeAssignment) {
        String assignedTo = (activeAssignment != null && activeAssignment.getEmployee() != null)
                ? activeAssignment.getEmployee().getFullName()
                : "Unassigned";
        String content = "Name: "        + nvl(asset.getName())        + "\n"
                       + "Category: "    + nvl(asset.getCategory())    + "\n"
                       + "Serial: "      + nvl(asset.getSerialNumber()) + "\n"
                       + "Status: "      + nvl(asset.getStatus())       + "\n"
                       + "Location: "    + nvl(asset.getLocation())     + "\n"
                       + "Assigned To: " + assignedTo;
        return generateQrCodeBase64(content);
    }

    public String generateQrCodeBase64(String content) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, QR_SIZE, QR_SIZE);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", baos);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (WriterException | IOException e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    private String nvl(Object value) {
        return value != null ? value.toString() : "-";
    }
}