import { PDFDocument, rgb, StandardFonts, TextAlignment } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { groupRepeatedComments } from '../utils/parsingUtils';

export interface ReportData {
  department: string;
  month: string;
  year: string;
  collection: number;
  visitor: number;
  gender: { Male: number; Female: number; LGBTQ: number; Others: number };
  clientType: { Citizen: number; Business: number; Government: number };
  cc1: { Yes: number; "Just Now": number; No: number };
  cc2: { Visible: number; "Somewhat Visible": number; "Difficult to see": number; "Not Visible": number; "N/A": number };
  cc3: { "Very Much": number; Somewhat: number; "Did Not Help": number; "N/A": number };
  date_collected?: string;
  sysrate: string;
  staffrate: string;
  overrate: string;
  qValues: Record<string, any>;
  comments: {
    positive: string[];
    negative: string[];
    suggestions: string[];
  };
  fullname?: string;
  collection_rate?: string;
}

const FIELD_MAP: Record<string, string> = {
  department: 'DEPARTMENT',
  month: 'FOR THE MONTH OF',
  collection: 'COLLECTED FORMS',
  visitor: 'REGISTERED CLIENTVISITOR',
  'gender.Male': 'MALE',
  'gender.Female': 'FEMALE',
  'gender.LGBTQ': 'LGBTQ',
  'gender.Others': 'PREFER NOT TO SAY',
  'clientType.Citizen': 'CITIZEN',
  'clientType.Business': 'BUSINESS',
  'clientType.Government': 'GOVERNMENT',
  'cc1.Yes': 'YES',
  'cc1.Just Now': 'JUST NOW',
  'cc1.No': 'NO',
  'cc2.Visible': 'VISIBLE',
  'cc2.Somewhat Visible': 'SOMEWHAT VISIBLE',
  'cc2.Difficult to see': 'DIFFICULT TO SEE',
  'cc2.Not Visible': 'NOT VISIBLE',
  'cc2.N/A': 'NA',
  'cc3.Very Much': 'VERY MUCH',
  'cc3.Somewhat': 'SOMEWHAT',
  'cc3.Did Not Help': 'DID NOT HELP',
  'cc3.N/A': 'NA2',
  date_collected: 'DATE COLLECTED',
  sysrate: 'SYSRATE',
  staffrate: 'STAFFRATE',
  overrate: 'OVERRATE',
  fullname: 'fullname',
  collection_rate: 'COLLECTION RATE'
};

function getNestedValue(obj: any, key: string) {
  return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : ''), obj);
}

function cleanseText(text: string) {
  if (!text) return "";
  return text
    .replace(/[^a-zA-Z0-9\s.,!?( )*]/g, '')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (const word of words) {
    const testLine = line + word + ' ';
    const testWidth = font.widthOfTextAtSize(testLine.trim(), fontSize);
    if (testWidth <= maxWidth) {
      line = testLine;
    } else {
      lines.push(line.trim());
      line = word + ' ';
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

export async function generateIndividualReport(data: ReportData) {
  const templatePath = path.join(process.cwd(), 'public', 'templates', 'REPORT.pdf');
  const existingPdfBytes = fs.readFileSync(templatePath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const form = pdfDoc.getForm();

  const formattedMonth = `${data.month} ${data.year}`;

  // Fill mapped fields
  for (const [key, fieldName] of Object.entries(FIELD_MAP)) {
    let value = key === 'month' ? formattedMonth : getNestedValue(data, key);
    // Maintain legacy: hide zeros to keep form clean
    if (value === "" || value === "0" || value === 0) value = "";

    try {
      const allFields = form.getFields();
      const field = allFields.find(f => f.getName().trim() === fieldName) as any;

      if (!field || typeof field.setText !== 'function') {
        console.warn(`[PDF] Field "${fieldName}" not found (Trimmed search also failed)`);
        continue;
      }

      const textValue = String(value);
      if (textValue.trim()) {
        console.log(`[PDF] Filling field: ${fieldName} with "${textValue}"`);
        // Apply center alignment
        if (typeof field.setAlignment === 'function') field.setAlignment(TextAlignment.Center);

        field.setText(textValue);
        if (typeof field.setFontSize === 'function') field.setFontSize(11);
      }
    } catch (err) {
      console.warn(`[PDF] Error filling ${fieldName}:`, err);
    }
  }

  // Fill Q Matrix
  const allFields = form.getFields(); // Cache fields for reuse
  for (let i = 0; i <= 9; i++) {
    const qKey = `Q${i}`;
    const qValues = data.qValues[qKey] || {};
    const pdfFields = [`${i}NA`, `${i}RATE`, `${i}5`, `${i}4`, `${i}3`, `${i}2`, `${i}1`];
    const dataKeys = ['NA', 'RATE', '5', '4', '3', '2', '1'];

    for (let j = 0; j < pdfFields.length; j++) {
      try {
        const fieldName = pdfFields[j];
        const field = allFields.find(f => f.getName().trim() === fieldName) as any;
        if (!field || typeof field.setText !== 'function') continue;

        const textValue = String(qValues[dataKeys[j]] || '');
        if (textValue.trim()) {
          // Apply center alignment to matrix fields
          if (typeof field.setAlignment === 'function') field.setAlignment(TextAlignment.Center);

          field.setText(textValue);
          field.setFontSize(9);
        }
      } catch (err) {
        // Quiet fail
      }
    }
  }

  // Handle Comments
  const pos = groupRepeatedComments(data.comments.positive || []);
  const neg = groupRepeatedComments(data.comments.negative || []);
  const sug = groupRepeatedComments(data.comments.suggestions || []);
  const allComments = [...pos, ...neg, ...sug];
  let shouldUseAttachment = false;

  const lineCount = (text: string) => wrapText(cleanseText(text), helveticaFont, 12, 500).length;

  const com1 = form.getField('COM1') as any;
  const com2 = form.getField('COM2') as any;

  if (allComments.length === 1) {
    const comment = allComments[0];
    if (lineCount(comment) > 2) {
      if (com1) com1.setText('Please see attached');
      shouldUseAttachment = true;
    } else {
      const lines = wrapText(cleanseText(comment), helveticaFont, 12, 500);
      if (com1) com1.setText('1. ' + lines[0]);
      if (lines[1] && com2) com2.setText('   ' + lines[1]);
    }
  } else if (allComments.length === 2) {
    if (lineCount(allComments[0]) > 1 || lineCount(allComments[1]) > 1) {
      if (com1) com1.setText('Please see attached');
      shouldUseAttachment = true;
    } else {
      if (com1) com1.setText('1. ' + cleanseText(allComments[0]));
      if (com2) com2.setText('2. ' + cleanseText(allComments[1]));
    }
  } else if (allComments.length > 2) {
    if (com1) com1.setText('Please see attached');
    shouldUseAttachment = true;
  } else {
    if (com1) com1.setText('No comment/complaint/suggestion.');
    if (com2) com2.setText('');
  }

  try {
    form.updateFieldAppearances(helveticaFont);
  } catch (e) {
    console.warn("[PDF] updateFieldAppearances failed:", e);
  }
  form.flatten();

  if (shouldUseAttachment || allComments.length > 2) {
    await addAttachmentPage(pdfDoc, data, helveticaFont);
  }

  return await pdfDoc.save();
}

async function addAttachmentPage(pdfDoc: PDFDocument, data: ReportData, font: any) {
  // Folio Size: 8.5" x 13" -> 612 x 936 points
  const FOLIO: [number, number] = [612, 936];
  const margin = 50;
  const lineHeight = 16;
  const fontSize = 12;
  const maxWidth = FOLIO[0] - (margin * 2);

  let currentPage = pdfDoc.addPage(FOLIO);
  let y = FOLIO[1] - margin;

  const checkPageOverflow = (neededHeight: number) => {
    if (y - neededHeight < margin) {
      currentPage = pdfDoc.addPage(FOLIO);
      y = FOLIO[1] - margin;
      return true;
    }
    return false;
  };

  const drawSection = (label: string, items: string[]) => {
    if (items.length === 0) return;

    // Check if we need a new page for the label
    checkPageOverflow(lineHeight * 2);

    currentPage.drawText(label, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
    y -= lineHeight;

    items.forEach((item, idx) => {
      const wrapped = wrapText(`${idx + 1}. ${cleanseText(item)}`, font, fontSize, maxWidth);
      wrapped.forEach(line => {
        // Check if this specific line fits, if not, new page
        if (checkPageOverflow(lineHeight)) {
          // If we rolled over to a new page, maybe re-draw the label? 
          // (Usually not needed for attachments, just continue)
        }
        currentPage.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
        y -= lineHeight;
      });
    });

    y -= 15; // Extra gap between sections
  };

  drawSection('Commendations:', groupRepeatedComments(data.comments.positive));
  drawSection('Complaints:', groupRepeatedComments(data.comments.negative));
  drawSection('Suggestions:', groupRepeatedComments(data.comments.suggestions));
}

export async function mergeReportPDFs(buffers: Uint8Array[]) {
  const mergedPdf = await PDFDocument.create();
  for (const buffer of buffers) {
    const doc = await PDFDocument.load(buffer);
    const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }
  return await mergedPdf.save();
}

/**
 * Replicates the legacy consolidated matrix report using 'conso.pdf' template.
 */
export async function generateSummaryReport(formData: any, month: string, year: string) {
  const templatePath = path.join(process.cwd(), 'public', 'templates', 'conso.pdf');
  const existingPdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 7;
  const cellPadding = 5;

  const page = pdfDoc.getPage(0);
  const { height } = page.getSize();

  const startX = 35;
  const startY = height - 130;
  const rowHeight = 12.5;
  const colWidths = Array(14).fill(62);

  const tableHeaders = [
    [
      { text: 'DEPARTMENT/ OFFICE', colspan: 1, rowspan: 3, bgColor: rgb(0.8, 0.9, 1) },
      { text: 'NUMBER OF RESPONDENTS', colspan: 1, rowspan: 3 },
      { text: 'NUMBER OF REGISTERED CLIENTS', colspan: 1, rowspan: 3 },
      { text: 'GENDER', colspan: 4, rowspan: 1 },
      { text: 'CRITERIA', colspan: 3, rowspan: 1 },
      { text: 'GENERAL RATING', colspan: 1, rowspan: 3, bgColor: rgb(1.0, 0.502, 0.502) },
      { text: 'COMMENTS', colspan: 3, rowspan: 1 },
    ],
    [
      { text: 'MALE', colspan: 1, rowspan: 2 },
      { text: 'FEMALE', colspan: 1, rowspan: 2 },
      { text: 'LGBTQ', colspan: 1, rowspan: 2 },
      { text: 'UNDEFINED', colspan: 1, rowspan: 2 },
      { text: 'ENVIRONMENT', colspan: 1, rowspan: 2 },
      { text: 'SYSTEMS AND PROCEDURE', colspan: 1, rowspan: 2 },
      { text: 'STAFF SERVICE', colspan: 1, rowspan: 2 },
      { text: 'POSITIVE', colspan: 1, rowspan: 2, bgColor: rgb(0.0, 0.859, 0.145) },
      { text: 'NEGATIVE', colspan: 1, rowspan: 2, bgColor: rgb(1.0, 0.239, 0.353) },
      { text: 'SUGGESTIONS', colspan: 1, rowspan: 2, bgColor: rgb(1.0, 0.867, 0.0) },
    ]
  ];

  let y = startY;
  const cellState: Record<string, boolean> = {};

  for (let r = 0; r < tableHeaders.length; r++) {
    let x = startX;
    let physCol = 0;
    const row = tableHeaders[r];

    for (let lCol = 0; lCol < row.length; lCol++) {
      while (cellState[`${r},${physCol}`]) {
        x += colWidths[physCol];
        physCol++;
      }

      const cell: any = row[lCol];
      const cSpan = cell.colspan || 1;
      const rSpan = cell.rowspan || 1;
      let cellWidth = 0;
      for (let i = 0; i < cSpan; i++) cellWidth += colWidths[physCol + i];
      const cellHeight = rowHeight * rSpan;

      page.drawRectangle({
        x: x,
        y: y - (cellHeight - rowHeight),
        width: cellWidth,
        height: cellHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
        color: cell.bgColor || undefined
      });

      const lines = splitTextIntoLinesInternal(cell.text, cellWidth - (cellPadding * 2), boldFont, fontSize);
      const tHeight = boldFont.heightAtSize(fontSize);
      let textY = (y - (cellHeight - rowHeight)) + (cellHeight / 2) + ((lines.length * tHeight) / 2) - tHeight;

      for (const line of lines) {
        const lWidth = boldFont.widthOfTextAtSize(line, fontSize);
        page.drawText(line, {
          x: x + (cellWidth / 2) - (lWidth / 2),
          y: textY,
          size: fontSize,
          font: boldFont,
          color: rgb(0, 0, 0)
        });
        textY -= tHeight;
      }

      if (rSpan > 1) {
        for (let rs = 1; rs < rSpan; rs++) {
          for (let cs = 0; cs < cSpan; cs++) cellState[`${r + rs},${physCol + cs}`] = true;
        }
      }
      x += cellWidth;
      physCol += cSpan;
    }
    y -= rowHeight;
  }

  // Draw Data Rows
  const offices = Array.isArray(formData) ? formData : Object.values(formData);

  for (const office of offices) {
    const total = (office.online || 0) + (office.offline || 0) || office.collection || 0;
    let rowData: any[] = [];
    let officeName = office.department;
    if (officeName === "PHO-Warehouse") officeName = "PHOWarehouse";

    if (total === 0) {
      rowData = [
        { text: officeName, colspan: 1, align: 'left' },
        { text: "No Collection", colspan: 10, bgColor: rgb(0.769, 0.753, 0.753) },
        { text: "", colspan: 1, bgColor: rgb(0.0, 0.859, 0.145) },
        { text: "", colspan: 1, bgColor: rgb(1.0, 0.239, 0.353) },
        { text: "", colspan: 1, bgColor: rgb(1.0, 0.867, 0.0) },
      ];
    } else {
      rowData = [
        { text: officeName, colspan: 1, align: 'left' },
        { text: total || "", colspan: 1 },
        { text: office.visitor || "", colspan: 1 },
        { text: office.gender?.Male || "", colspan: 1 },
        { text: office.gender?.Female || "", colspan: 1 },
        { text: office.gender?.LGBTQ || "", colspan: 1 },
        { text: office.gender?.Others || "", colspan: 1 },
        { text: (office.qValues?.Q1?.RATE === "N/A" || !office.qValues?.Q1?.RATE) ? "" : office.qValues.Q1.RATE, colspan: 1 },
        { text: (office.sysRate === "N/A" || !office.sysRate) ? "" : office.sysRate, colspan: 1 },
        { text: (office.staffRate === "N/A" || !office.staffRate) ? "" : office.staffRate, colspan: 1 },
        { text: (office.overrate === "N/A" || !office.overrate) ? "" : office.overrate, colspan: 1, bgColor: rgb(1.0, 0.502, 0.502) },
        { text: office.comments?.positive?.length || "", colspan: 1, bgColor: rgb(0.0, 0.859, 0.145) },
        { text: office.comments?.negative?.length || "", colspan: 1, bgColor: rgb(1.0, 0.239, 0.353) },
        { text: office.comments?.suggestions?.length || "", colspan: 1, bgColor: rgb(1.0, 0.867, 0.0) },
      ];
    }

    let rx = startX;
    let currCol = 0;
    for (let i = 0; i < rowData.length; i++) {
      const cell = rowData[i];
      const span = cell.colspan || 1;
      const sWidth = colWidths.slice(currCol, currCol + span).reduce((s, w) => s + w, 0);

      page.drawRectangle({
        x: rx,
        y: y - rowHeight,
        width: sWidth,
        height: rowHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
        color: cell.bgColor || undefined
      });

      if (cell.text) {
        const lines = splitTextIntoLinesInternal(String(cell.text), sWidth - (cellPadding * 2), regularFont, fontSize);
        const tH = regularFont.heightAtSize(fontSize);
        let ty = y - (rowHeight / 2) + ((lines.length * tH) / 2) - tH;

        for (const line of lines) {
          const lw = regularFont.widthOfTextAtSize(line, fontSize);
          let tx = rx + (sWidth / 2) - (lw / 2);
          if (i === 0 || cell.align === 'left') tx = rx + cellPadding;
          page.drawText(line, { x: tx, y: ty, size: fontSize, font: regularFont, color: rgb(0, 0, 0) });
          ty -= tH;
        }
      }
      rx += sWidth;
      currCol += span;
    }
    y -= rowHeight;
  }

  // Fill monthYear field
  const form = pdfDoc.getForm();
  try {
    const monthYearField = form.getTextField('monthYear');
    monthYearField.setText(`${month} ${year}`.toUpperCase());
  } catch (e) {
    console.warn("Could not find monthYear field in conso.pdf");
  }

  form.flatten();
  return await pdfDoc.save();
}

/**
 * Generates a premium multi-page AI Intelligence Report PDF.
 */
export async function generateAIReport(content: any, images: string[], period: string, year: string, preparedBy?: string, position?: string) {
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const FOLIO: [number, number] = [612, 936]; // 8.5" x 13"
  const margin = 50;
  const contentWidth = FOLIO[0] - (margin * 2);

  let currentPage = pdfDoc.addPage(FOLIO);
  let y = FOLIO[1] - 60;

  const drawHeader = (page: any) => {
    const headerY = FOLIO[1] - 60;
    page.drawText('PROVINCIAL GOVERNMENT OF LA UNION', { x: margin, y: headerY, size: 14, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText('OFFICE OF THE PROVINCIAL GOVERNOR', { x: margin, y: headerY - 18, size: 12, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
    page.drawLine({ start: { x: margin, y: headerY - 25 }, end: { x: FOLIO[0] - margin, y: headerY - 25 }, thickness: 1.5, color: rgb(0.31, 0.27, 0.9) });
    return headerY - 60;
  };

  const checkPage = (needed: number) => {
    if (y - needed < 60) {
      currentPage = pdfDoc.addPage(FOLIO);
      y = drawHeader(currentPage);
    }
  };

  const drawJustifiedText = (text: string, size: number, font: any, maxWidth: number, color = rgb(0, 0, 0)) => {
    const paragraphs = text.split('\n');
    for (const p of paragraphs) {
      if (!p.trim()) { y -= size; continue; }
      const words = p.split(/\s+/);
      let line: string[] = [];
      let lineWidth = 0;
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordWidth = font.widthOfTextAtSize(word, size);
        const spaceWidth = font.widthOfTextAtSize(' ', size);
        if (lineWidth + wordWidth + spaceWidth > maxWidth) {
          checkPage(size * 1.5);
          const totalSpaces = line.length - 1;
          if (totalSpaces > 0) {
            const extraSpace = (maxWidth - (lineWidth - spaceWidth)) / totalSpaces;
            let currentX = margin;
            for (let j = 0; j < line.length; j++) {
              currentPage.drawText(line[j], { x: currentX, y, size, font, color });
              currentX += font.widthOfTextAtSize(line[j], size) + spaceWidth + extraSpace;
            }
          } else {
            currentPage.drawText(line[0], { x: margin, y, size, font, color });
          }
          y -= (size * 1.4);
          line = [word];
          lineWidth = wordWidth + spaceWidth;
        } else {
          line.push(word);
          lineWidth += wordWidth + spaceWidth;
        }
      }
      if (line.length > 0) {
        checkPage(size * 1.5);
        currentPage.drawText(line.join(' '), { x: margin, y, size, font, color });
        y -= (size * 1.8);
      }
    }
  };

  y = drawHeader(currentPage);

  // 1. Report Title
  currentPage.drawText('CUSTOMER FEEDBACK ANALYSIS REPORT', { x: margin, y, size: 18, font: boldFont, color: rgb(0, 0, 0) });
  y -= 20;
  currentPage.drawText(`PERIOD: ${period.toUpperCase()} ${year}`, { x: margin, y, size: 10, font: boldFont, color: rgb(0.5, 0.5, 0.5) });
  y -= 40;

  // 2. Executive Summary
  checkPage(100);
  currentPage.drawText('I. EXECUTIVE SUMMARY', { x: margin, y, size: 12, font: boldFont, color: rgb(0, 0, 0) });
  y -= 20;
  drawJustifiedText(content.executiveSummary || "No summary available.", 10, regularFont, contentWidth);
  y -= 10;

  // 3. Strategic Insights
  checkPage(100);
  currentPage.drawText('II. KEY STRATEGIC INSIGHTS', { x: margin, y, size: 12, font: boldFont, color: rgb(0, 0, 0) });
  y -= 20;
  const insights = content.keyInsights || [];
  for (const insight of insights) {
    checkPage(40);
    currentPage.drawCircle({ x: margin + 5, y: y + 3, size: 2, color: rgb(0.31, 0.27, 0.9) });
    const lines = wrapText(insight, regularFont, 10, contentWidth - 30);
    for (const line of lines) {
      currentPage.drawText(line, { x: margin + 20, y, size: 10, font: regularFont, color: rgb(0, 0, 0) });
      y -= 13;
    }
    y -= 8;
  }
  y -= 20;

  // 4. Performance Metrics Grid
  checkPage(150);
  currentPage.drawText('III. CORE METRICS OVERVIEW', { x: margin, y, size: 12, font: boldFont, color: rgb(0, 0, 0) });
  y -= 20;
  const metrics = content.metrics || {};
  const metricLabels = [
    ['Satisfaction', `${metrics.avgSatisfaction}%`],
    ['Collection', `${metrics.avgCollection}%`],
    ['Digital Adoption', `${metrics.digitalAdoptionRate}%`],
    ['CC Compliance', `${metrics.ccComplianceScore}%`]
  ];

  let mx = margin;
  for (const [label, val] of metricLabels) {
    currentPage.drawRectangle({ x: mx, y: y - 35, width: 120, height: 45, color: rgb(0.96, 0.97, 1), borderColor: rgb(0, 0, 0), borderWidth: 0.5 });
    currentPage.drawText(label.toUpperCase(), { x: mx + 10, y: y - 12, size: 7, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
    currentPage.drawText(val, { x: mx + 10, y: y - 28, size: 14, font: boldFont, color: rgb(0.31, 0.27, 0.9) });
    mx += 130;
  }
  y -= 60;
  if (content.chartExplanations?.metricsOverview) {
    drawJustifiedText(content.chartExplanations.metricsOverview, 10, regularFont, contentWidth, rgb(0, 0, 0));
  }
  y -= 20;

  // 4. Analytical Visualizations
  if (images && images.length > 0) {
    checkPage(400);
    currentPage.drawText('IV. ANALYTICAL VISUALIZATIONS & TRENDS', { x: margin, y, size: 12, font: boldFont, color: rgb(0, 0, 0) });
    y -= 30;

    const chartExps = [content.chartExplanations?.satisfactionTrend, content.chartExplanations?.collectionTrend];

    for (let i = 0; i < images.length; i++) {
      try {
        const base64 = images[i];
        const imageBytes = Buffer.from(base64.split(',')[1], 'base64');
        const embeddedImage = await pdfDoc.embedPng(imageBytes);
        const imgWidth = contentWidth - 40;
        const imgHeight = (embeddedImage.height / embeddedImage.width) * imgWidth;

        checkPage(imgHeight + 100);
        currentPage.drawImage(embeddedImage, { x: margin + 20, y: y - imgHeight, width: imgWidth, height: imgHeight });
        y -= (imgHeight + 20);

        if (chartExps[i]) {
          drawJustifiedText(chartExps[i], 10, regularFont, contentWidth, rgb(0, 0, 0));
        }
        y -= 20;
      } catch (err) {
        console.error("Failed to embed image:", err);
      }
    }
  }

  // 5. Departmental Performance Audit (Table Layout)
  checkPage(100);
  currentPage.drawText('V. DEPARTMENTAL PERFORMANCE AUDIT', { x: margin, y, size: 12, font: boldFont, color: rgb(0, 0, 0) });
  y -= 30;

  const tableHeaders = ['DEPARTMENT', 'SAT.', 'ANALYSIS & PERFORMANCE AUDIT', 'STRENGTH / GROWTH'];
  const colWidths = [120, 40, 240, 112];

  // Header Row
  currentPage.drawRectangle({ x: margin, y: y - 20, width: contentWidth, height: 20, color: rgb(0.9, 0.9, 0.95), borderColor: rgb(0, 0, 0), borderWidth: 0.5 });
  let tx = margin + 5;
  for (let i = 0; i < tableHeaders.length; i++) {
    currentPage.drawText(tableHeaders[i], { x: tx, y: y - 13, size: 7, font: boldFont });
    tx += colWidths[i];
  }
  y -= 20;

  const departments = content.departmentBreakdown || [];
  for (const dept of departments) {
    const analysisLines = splitTextIntoLinesInternal(dept.performance, contentWidth - 270, regularFont, 7);
    const strengthLines = splitTextIntoLinesInternal(`Strength: ${dept.strength}\nGrowth: ${dept.weakness}`, 110, regularFont, 7);
    const rowHeight = Math.max(analysisLines.length * 9, strengthLines.length * 9, 30) + 10;

    checkPage(rowHeight);

    currentPage.drawRectangle({ x: margin, y: y - rowHeight, width: contentWidth, height: rowHeight, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5 });

    // Dept Name
    const deptLines = splitTextIntoLinesInternal(dept.name.toUpperCase(), 110, boldFont, 8);
    let dy = y - 15;
    for (const l of deptLines) {
      currentPage.drawText(l, { x: margin + 5, y: dy, size: 8, font: boldFont });
      dy -= 10;
    }

    // Saturation
    currentPage.drawText(`${dept.satisfaction}%`, { x: margin + 125, y: y - 15, size: 8, font: boldFont, color: rgb(0.31, 0.27, 0.9) });

    // Analysis
    let ay = y - 12;
    for (const l of analysisLines) {
      currentPage.drawText(l, { x: margin + 165, y: ay, size: 7, font: regularFont });
      ay -= 9;
    }

    // Strength
    let sy = y - 12;
    for (const l of strengthLines) {
      currentPage.drawText(l, { x: margin + 405, y: sy, size: 7, font: regularFont });
      sy -= 9;
    }

    y -= rowHeight;
  }

  // 6. Strategic Recommendations
  checkPage(100);
  y -= 20;
  currentPage.drawText('VI. STRATEGIC ROADMAP & RECOMMENDATIONS', { x: margin, y, size: 14, font: boldFont, color: rgb(0, 0, 0) });
  y -= 30;

  const recs = content.recommendations || [];
  for (const rec of recs) {
    checkPage(40);
    currentPage.drawCircle({ x: margin + 5, y: y + 3, size: 3, color: rgb(0.31, 0.27, 0.9) });
    const lines = wrapText(rec, regularFont, 10, contentWidth - 30);
    for (const line of lines) {
      currentPage.drawText(line, { x: margin + 20, y, size: 10, font: regularFont, color: rgb(0, 0, 0) });
      y -= 14;
    }
    y -= 10;
  }

  // 7. Signature Block
  checkPage(120);
  y -= 50;
  currentPage.drawText('Prepared By:', { x: margin, y, size: 10, font: regularFont });
  y -= 40;
  currentPage.drawText(preparedBy?.toUpperCase() || "PGLU STAFF", { x: margin, y: y + 10, size: 11, font: boldFont });
  currentPage.drawLine({ start: { x: margin, y }, end: { x: margin + 250, y }, thickness: 1 });
  currentPage.drawText(position?.toUpperCase() || "ADMINISTRATIVE OFFICER", { x: margin, y: y - 15, size: 9, font: regularFont });

  return await pdfDoc.save();
}

function splitTextIntoLinesInternal(text: string, maxWidth: number, font: any, size: number) {
  const paragraphs = String(text).split('\n');
  const allLines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      try {
        const testWidth = font.widthOfTextAtSize(testLine, size);
        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) allLines.push(currentLine);
          currentLine = word;
        }
      } catch (e) {
        // Fallback for character encoding issues
        if (currentLine) allLines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) allLines.push(currentLine);
  }
  return allLines;
}
