import fs from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

let inputText = "";
for await (const chunk of process.stdin) inputText += chunk;
const input = JSON.parse(inputText || "{}");
if (!Array.isArray(input.records)) throw new Error("records must be an array");
if (!input.workbookPath) throw new Error("workbookPath is required");

function safeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function campaign(attribution = {}) {
  return [attribution.utm_source, attribution.utm_medium, attribution.utm_campaign]
    .filter(Boolean)
    .join(" / ");
}

const headers = [
  "Recibido",
  "Nombre",
  "Teléfono",
  "Email",
  "Situación",
  "Objetivo",
  "Urgencia",
  "Tipo de propiedad",
  "Región",
  "Comuna",
  "Mensaje",
  "Campaña",
  "Página",
  "ID",
  "Modo",
  "Consentimiento",
  "Estado",
];

const rows = input.records.map((record) => {
  const lead = record.lead || {};
  const property = lead.property || {};
  const attribution = lead.attribution || {};
  return [
    safeDate(record.receivedAt),
    lead.nombre_propietario || "",
    lead.telefono || "",
    lead.email || "",
    lead.problema_principal || "",
    lead.objetivo_propietario || "",
    lead.urgencia || "",
    property.tipo_propiedad || "",
    property.region || "",
    property.comuna || "",
    lead.observaciones || "",
    campaign(attribution),
    attribution.page_url || "",
    record.submissionId || "",
    record.preview ? "Vista previa" : "Producción",
    lead.privacy?.consent ? "Sí" : "No",
    lead.estado_pipeline || "nuevo",
  ];
});

const widths = [19, 22, 18, 28, 22, 34, 12, 20, 30, 18, 45, 28, 36, 24, 14, 16, 14];
const workbook = new ExcelJS.Workbook();
workbook.creator = "Brena";
workbook.created = new Date();
const sheet = workbook.addWorksheet("Leads", {
  views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
});
sheet.columns = widths.map((width) => ({ width }));

sheet.mergeCells("A1:Q1");
sheet.getCell("A1").value = "Contactos recibidos desde Brena";
sheet.mergeCells("A2:Q2");
sheet.getCell("A2").value = "Este archivo se actualiza automáticamente con cada formulario válido.";
sheet.getRow(4).values = headers;
for (const row of rows) sheet.addRow(row);

sheet.getRow(1).height = 34;
sheet.getRow(1).eachCell((cell) => {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111510" } };
  cell.font = { name: "Aptos Display", size: 18, bold: true, color: { argb: "FFF4F0E7" } };
  cell.alignment = { vertical: "middle" };
});
sheet.getRow(2).height = 24;
sheet.getRow(2).eachCell((cell) => {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6E7D8" } };
  cell.font = { name: "Aptos", size: 10, color: { argb: "FF34372F" } };
  cell.alignment = { vertical: "middle" };
});
sheet.getRow(4).height = 30;
sheet.getRow(4).eachCell((cell) => {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB95738" } };
  cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  cell.alignment = { vertical: "middle", wrapText: true };
  cell.border = { bottom: { style: "medium", color: { argb: "FF8A3D29" } } };
});

for (let rowNumber = 5; rowNumber <= 4 + rows.length; rowNumber += 1) {
  const row = sheet.getRow(rowNumber);
  row.height = 30;
  row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    cell.font = { name: "Aptos", size: 10, color: { argb: "FF20231E" } };
    cell.alignment = {
      vertical: "top",
      wrapText: columnNumber >= 11 && columnNumber <= 13,
    };
    cell.border = { bottom: { style: "thin", color: { argb: "FFDDD8CD" } } };
  });
  row.getCell(1).numFmt = "yyyy-mm-dd hh:mm";
  row.getCell(3).numFmt = "@";
  row.getCell(4).numFmt = "@";
}

await fs.mkdir(path.dirname(input.workbookPath), { recursive: true });
const temporaryPath = `${input.workbookPath}.${process.pid}.tmp.xlsx`;
await workbook.xlsx.writeFile(temporaryPath);
await fs.rm(input.workbookPath, { force: true });
await fs.rename(temporaryPath, input.workbookPath);

if (input.previewPath) {
  const { Workbook: PreviewWorkbook } = await import("@oai/artifact-tool");
  const previewWorkbook = PreviewWorkbook.create();
  const previewSheet = previewWorkbook.worksheets.add("Leads");
  previewSheet.showGridLines = false;
  previewSheet.freezePanes.freezeRows(4);
  previewSheet.getRange("A1:Q1").merge();
  previewSheet.getRange("A1").values = [["Contactos recibidos desde Brena"]];
  previewSheet.getRange("A2:Q2").merge();
  previewSheet.getRange("A2").values = [["Este archivo se actualiza automáticamente con cada formulario válido."]];
  previewSheet.getRangeByIndexes(3, 0, rows.length + 1, headers.length).values = [headers, ...rows];
  previewSheet.getRange("A1:Q1").format = {
    fill: "#111510",
    font: { name: "Aptos Display", size: 18, bold: true, color: "#F4F0E7" },
  };
  previewSheet.getRange("A4:Q4").format = {
    fill: "#B95738",
    font: { name: "Aptos", size: 10, bold: true, color: "#FFFFFF" },
    wrapText: true,
  };
  for (let column = 0; column < widths.length; column += 1) {
    previewSheet.getRangeByIndexes(0, column, Math.max(5, rows.length + 4), 1).format.columnWidth = widths[column];
  }
  const preview = await previewWorkbook.render({
    sheetName: "Leads",
    range: `A1:Q${Math.max(5, 4 + rows.length)}`,
    scale: 0.8,
    format: "png",
  });
  await fs.mkdir(path.dirname(input.previewPath), { recursive: true });
  await fs.writeFile(input.previewPath, new Uint8Array(await preview.arrayBuffer()));
}

if (input.inspectionPath) {
  const inspectedRows = [headers, ...rows].slice(0, 12).map((row) => (
    row.map((value) => value instanceof Date ? value.toISOString() : value)
  ));
  await fs.mkdir(path.dirname(input.inspectionPath), { recursive: true });
  await fs.writeFile(input.inspectionPath, `${JSON.stringify({
    sheet: "Leads",
    range: `A1:Q${Math.max(5, 4 + rows.length)}`,
    values: inspectedRows,
    formulaErrors: [],
  })}\n`, "utf8");
}
