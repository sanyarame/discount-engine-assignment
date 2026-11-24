import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PDFCartUploader({ onCartExtracted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handlePDFUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (file.type !== "application/pdf") {
        throw new Error("Please upload a valid PDF file.");
      }

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      const allItems = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        allItems.push(...textContent.items);
      }

      const items = allItems
        .filter((item) => item.str && item.str.trim())
        .map((item) => ({
          text: item.str.trim(),
          x: item.transform[4],
          y: item.transform[5],
        }));

      const headerItems = items.filter((item) =>
        ["product", "brand", "platform", "base price"].some(
          (header) => item.text.toLowerCase() === header
        )
      );

      const headers = {};

      headerItems.forEach((item) => {
        headers[item.text.toLowerCase()] = item;
      });

      if (
        !headers.product ||
        !headers.brand ||
        !headers.platform ||
        !headers["base price"]
      ) {
        throw new Error(
          "Could not find the expected Product, Brand, Platform and Base Price columns."
        );
      }

      const headerY = headers.product.y;

      const headerPositions = [
        headers.product.x,
        headers.brand.x,
        headers.platform.x,
        headers["base price"].x,
      ].sort((a, b) => a - b);

      const boundaries = [
        -Infinity,
        (headerPositions[0] + headerPositions[1]) / 2,
        (headerPositions[1] + headerPositions[2]) / 2,
        (headerPositions[2] + headerPositions[3]) / 2,
        Infinity,
      ];

      const rows = [];

      items
        .filter((item) => item.y < headerY - 5)
        .forEach((item) => {
          let row = rows.find(
            (r) => Math.abs(r.y - item.y) < 3
          );

          if (!row) {
            row = { y: item.y, columns: ["", "", "", ""] };
            rows.push(row);
          }

          const columnIndex = headerPositions.findIndex(
            (position, index) =>
              item.x >= boundaries[index] &&
              item.x < boundaries[index + 1]
          );

          if (columnIndex !== -1) {
            row.columns[columnIndex] +=
              (row.columns[columnIndex] ? " " : "") + item.text;
          }
        });

      const extractedCart = [];

      rows.forEach((row, index) => {
        const [product, brand, platform, priceText] =
          row.columns.map((column) => column.trim());

        if (!product || !brand || !platform || !priceText) return;

        const price = Number(
          priceText.replace(/[^\d.]/g, "")
        );

        if (!Number.isFinite(price) || price <= 0) return;

        extractedCart.push({
          itemId: `PDF-${index + 1}`,
          product,
          brand,
          platform,
          basePrice: Math.round(price),
        });
      });

      if (extractedCart.length === 0) {
        throw new Error(
          "No valid cart items could be extracted. Please check the PDF table format."
        );
      }

      onCartExtracted(extractedCart);

      setMessage(
        `Successfully extracted ${extractedCart.length} cart items.`
      );
    } catch (err) {
      setError(err.message || "Failed to extract the PDF.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "20px",
        marginTop: "24px",
      }}
    >
      <h2>Upload Cart PDF</h2>

      <p>
        Upload a PDF containing Product, Brand, Platform and Base Price.
      </p>

      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={handlePDFUpload}
        disabled={loading}
      />

      {loading && <p>Extracting PDF cart...</p>}

      {error && (
        <p style={{ color: "red", marginTop: "12px" }}>
          {error}
        </p>
      )}

      {message && (
        <p style={{ color: "green", marginTop: "12px" }}>
          {message}
        </p>
      )}
    </div>
  );
}