import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

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

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Leads");
sheet.showGridLines = false;
sheet.freezePanes.freezeRows(4);

sheet.getRange("A1:Q1").merge();
sheet.getRange("A1").values = [["Contactos recibidos desde Brena"]];
sheet.getRange("A2:Q2").merge();
sheet.getRange("A2").values = [["Este archivo se actualiza automáticamente con cada formulario válido."]];
sheet.getRangeByIndexes(3, 0, rows.length + 1, headers.length).values = [headers, ...rows];

sheet.getRange("A1:Q1").format = {
  fill: "#111510",
  font: { name: "Aptos Display", size: 18, bold: true, color: "#F4F0E7" },
  verticalAlignment: "center",
};
sheet.getRange("A1:Q1").format.rowHeight = 34;
sheet.getRange("A2:Q2").format = {
  fill: "#E6E7D8",
  font: { name: "Aptos", size: 10, color: "#34372F" },
  verticalAlignment: "center",
};
sheet.getRange("A2:Q2").format.rowHeight = 24;
sheet.getRange("A4:Q4").format = {
  fill: "#B95738",
  font: { name: "Aptos", size: 10, bold: true, color: "#FFFFFF" },
  verticalAlignment: "center",
  wrapText: true,
  borders: { bottom: { style: "medium", color: "#8A3D29" } },
};
sheet.getRange("A4:Q4").format.rowHeight = 30;

if (rows.length > 0) {
  const lastRow = 4 + rows.length;
  sheet.getRange(`A5:Q${lastRow}`).format = {
    font: { name: "Aptos", size: 10, color: "#20231E" },
    verticalAlignment: "top",
    borders: { insideHorizontal: { style: "thin", color: "#DDD8CD" } },
  };
  sheet.getRange(`A5:A${lastRow}`).format.numberFormat = "yyyy-mm-dd hh:mm";
  sheet.getRange(`C5:D${lastRow}`).format.numberFormat = "@";
  sheet.getRange(`K5:M${lastRow}`).format.wrapText = true;
  sheet.getRange(`A5:Q${lastRow}`).format.rowHeight = 30;
}

const widths = [19, 22, 18, 28, 22, 34, 12, 20, 30, 18, 45, 28, 36, 24, 14, 16, 14];
for (let column = 0; column < widths.length; column += 1) {
  sheet.getRangeByIndexes(0, column, Math.max(5, rows.length + 4), 1).format.columnWidth = widths[column];
}

await fs.mkdir(path.dirname(input.workbookPath), { recursive: true });
const temporaryPath = `${input.workbookPath}.${process.pid}.tmp.xlsx`;
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(temporaryPath);
await fs.rm(input.workbookPath, { force: true });
await fs.rename(temporaryPath, input.workbookPath);
await fs.rm(`${temporaryPath}.inspect.ndjson`, { force: true });

if (input.previewPath) {
  const preview = await workbook.render({
    sheetName: "Leads",
    range: `A1:Q${Math.max(5, 4 + rows.length)}`,
    scale: 0.8,
    format: "png",
  });
  await fs.mkdir(path.dirname(input.previewPath), { recursive: true });
  await fs.writeFile(input.previewPath, new Uint8Array(await preview.arrayBuffer()));
}

if (input.inspectionPath) {
  const inspection = await workbook.inspect({
    kind: "table",
    range: `Leads!A1:Q${Math.max(5, 4 + rows.length)}`,
    include: "values,formulas",
    tableMaxRows: 12,
    tableMaxCols: 17,
  });
  const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    summary: "final formula error scan",
  });
  await fs.writeFile(input.inspectionPath, `${inspection.ndjson}\n${errors.ndjson}\n`, "utf8");
}
