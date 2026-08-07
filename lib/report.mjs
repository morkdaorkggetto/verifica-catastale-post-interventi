import { plantNatureFor, plantTypeFor } from "./plants.mjs";

const missing = (label) => `[[DA INSERIRE: ${label.toUpperCase()}]]`;

function supplied(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function field(value, label) {
  return supplied(value) ? String(value) : missing(label);
}

function money(value) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function number(value) {
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function yesNo(value) {
  return value ? "Disponibile" : "Non disponibile";
}

export function reportFileName(caseName, extension) {
  const stem = (caseName || "verifica-catastale")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "verifica-catastale";
  return `${stem}-relazione.${extension}`;
}

export function buildMarkdownReport(data) {
  const { technician, unit, result, calculation } = data;
  const lines = [
    "# Relazione tecnica di verifica catastale post-interventi",
    "",
    `**Riferimento pratica:** ${field(unit.caseName, "riferimento della pratica")}`,
    `**Data di elaborazione:** ${field(data.generatedAt, "data di elaborazione")}`,
    "",
    "## 1. Tecnico incaricato",
    "",
    `- Nome e cognome: ${field(technician.name, "nome e cognome del tecnico")}`,
    `- Qualifica professionale: ${field(technician.qualification, "qualifica professionale")}`,
    `- Ordine o Collegio: ${field(technician.register, "ordine o collegio di appartenenza")}`,
    `- Numero di iscrizione: ${field(technician.registrationNumber, "numero di iscrizione")}`,
    `- Studio o recapito: ${field(technician.office, "studio o recapito professionale")}`,
    "",
    "## 2. Identificazione dell’unità immobiliare",
    "",
    `- Comune: ${field(unit.municipality, "comune")}`,
    `- Zona censuaria: ${field(unit.censusZone, "zona censuaria")}`,
    `- Foglio: ${field(unit.sheet, "foglio")}`,
    `- Particella: ${field(unit.parcel, "particella")}`,
    `- Subalterno: ${field(unit.sub, "subalterno")}`,
    `- Categoria: ${field(unit.category, "categoria catastale")}`,
    `- Classe in atti: ${field(unit.cadastralClass, "classe in atti")}`,
    `- Rendita in atti: ${unit.rent > 0 ? money(unit.rent) : missing("rendita catastale in atti")}`,
    `- Classamento ante operam verificato: ${data.coherence === "yes" ? "Sì" : data.coherence === "no" ? "No" : "Non ancora verificato"}`,
    "",
    "## 3. Perimetro della verifica",
    "",
    data.changes.length
      ? `Sono state dichiarate le seguenti mutazioni oggettive: ${data.changes.join(", ")}.`
      : "Non sono state dichiarate mutazioni oggettive relative a destinazione, consistenza, distribuzione rilevante o configurazione planimetrica.",
    "",
    `**Metodo selezionato:** ${result.method}`,
    "",
  ];

  if (data.analysisPath === "plants") {
    lines.push(
      "## 4. Metodo economico per il mero ampliamento impiantistico",
      "",
      "La verifica è stata sviluppata mediante il confronto tra il valore catastale ante operam e il valore medio infracensuario della dotazione impiantistica riferito al biennio economico 1988–1989. La tipologia tecnica serve a selezionare dati e gate pertinenti; non trasferisce automaticamente nel catasto i massimali fiscali ENEA.",
      "",
      "| Impianto | Intervento | Anno | Dato tecnico | Valore a nuovo | Quota UIU | Valore 1988–1989 |",
      "|---|---|---:|---|---:|---:|---:|",
      ...data.plants.map((plant, index) => {
        const row = calculation.rows[index] || {};
        const type = plantTypeFor(plant.typeId);
        const nature = plantNatureFor(plant.interventionNature);
        const metricValue = plant.typeId === "photovoltaic" ? plant.powerKw : plant.metricValue;
        return `| ${field(plant.description || type.label, `descrizione impianto ${index + 1}`)} (${field(plant.variant, `tipologia tecnica impianto ${index + 1}`)}) | ${nature.label} | ${field(plant.year, `anno impianto ${index + 1}`)} | ${supplied(metricValue) && Number(metricValue) > 0 ? `${number(metricValue)} — ${type.metricLabel}` : missing(`dato tecnico impianto ${index + 1}`)} | ${money(plant.cost)} | ${number(plant.share)}% | ${money(row.adjustedValue)} |`;
      }),
      "",
      ...data.plants.flatMap((plant, index) => {
        const row = calculation.rows[index] || {};
        const type = plantTypeFor(plant.typeId);
        return [
          `### ${index + 1}. ${plant.description || type.label}`,
          "",
          `- Trattamento: ${type.treatmentLabel}`,
          `- Assunzione metodologica: ${type.note}`,
          `- Fonte del valore: ${field(plant.costSource, `fonte del valore impianto ${index + 1}`)}`,
          `- Vita utile / residuo: ${field(plant.usefulLife, `vita utile impianto ${index + 1}`)} anni / ${field(plant.residual, `residuo impianto ${index + 1}`)}%`,
          `- Esclusione applicata: ${row.exclusionReason || "Nessuna"}`,
          ...(row.exclusion?.source ? [`- Fonte dell’esclusione: ${row.exclusion.source}`] : []),
          "",
        ];
      }),
      `- Moltiplicatore della categoria: ${calculation.multiplier ?? missing("moltiplicatore")}`,
      `- Valore catastale ante operam: ${money(calculation.valueBefore)}`,
      `- Valore impianti ragguagliato: ${money(calculation.plantValue)}`,
      `- Valore post operam stimato: ${money(calculation.valueAfter)}`,
      `- Incidenza calcolata: ${number(calculation.incidence)}%`,
      "- Benchmark operativo: 15,00%",
      `- Scarto tariffario locale: ${calculation.localGap === null || calculation.localGap === undefined ? "Non disponibile" : `${number(calculation.localGap)}%`}`,
      `- Convergenza dei riferimenti: ${calculation.convergenceStatus === "borderline" ? "No — zona di incertezza" : calculation.convergenceStatus === "convergent-above" ? "Sì — entrambi superati" : calculation.convergenceStatus === "convergent-below" ? "Sì — entrambi non superati" : "Non verificabile senza tariffe locali"}`,
      "",
    );
    if (calculation.thresholdSource === "local-tariff") {
      lines.push(
        `Tariffa della classe attuale: ${field(unit.currentTariff, "tariffa della classe attuale")}.`,
        `Tariffa della classe successiva: ${field(unit.nextTariff, "tariffa della classe successiva")}.`,
        "",
      );
    }
  } else {
    lines.push(
      "## 4. Metodo comparativo per opere miste o miglioramenti qualitativi",
      "",
      "La verifica non è stata ricondotta alla mera somma dei costi sostenuti. Lo stato post operam è stato confrontato con l’unità tipo della classe in atti e con l’ordinarietà del contesto locale, distinguendo manutenzione, recupero dell’obsolescenza e caratteristiche effettivamente superiori.",
      "",
      "| Fattore | Valutazione dichiarata |",
      "|---|---|",
      ...data.factors.map((factor) => `| ${factor.title} | ${factor.label} |`),
      "",
      `- Unità tipo / Modello 16: ${yesNo(data.evidence.unitType)}`,
      `- UIU comparabili locali: ${yesNo(data.evidence.comparables)}`,
      `- Quadro tariffario: ${yesNo(data.evidence.tariffTable)}`,
      "",
    );
  }

  lines.push(
    "## 5. Esito dello screening",
    "",
    `**${result.title}**`,
    "",
    result.text,
    "",
    `- Attendibilità dichiarata: ${result.confidence}`,
    `- Metodo applicato: ${result.method}`,
    "",
    "### Passaggi successivi",
    "",
    ...result.actions.map((action) => `- ${action}`),
    "",
    "## 6. Annotazioni del tecnico",
    "",
    supplied(data.notes) ? data.notes : missing("annotazioni e riscontri del tecnico"),
    "",
    "## 7. Avvertenze",
    "",
    "Il presente documento costituisce una relazione di supporto alla verifica tecnica. Non determina automaticamente categoria, classe o rendita catastale definitiva e non sostituisce la dichiarazione DOCFA, l’esame delle unità tipo, il quadro tariffario locale o le valutazioni dell’Ufficio provinciale – Territorio.",
    "",
    `Luogo e data: ${field(technician.office, "luogo")}, ${field(data.generatedAt, "data")}`,
    "",
    `Firma del tecnico: ${missing("firma del tecnico")}`,
    "",
  );

  return lines.join("\n");
}

function rtfEscape(text) {
  let output = "";
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const code = text.charCodeAt(index);
    if (char === "\\" || char === "{" || char === "}") output += `\\${char}`;
    else if (code >= 32 && code <= 126) output += char;
    else {
      let value = code;
      if (value > 32767) value -= 65536;
      output += `\\u${value}?`;
    }
  }
  return output;
}

export function markdownToRtf(markdown) {
  const body = markdown.split("\n").map((line) => {
    if (line.startsWith("# ")) return `\\pard\\sa240\\fs32\\b ${rtfEscape(line.slice(2))}\\b0\\fs22\\par`;
    if (line.startsWith("## ")) return `\\pard\\sa180\\fs27\\b ${rtfEscape(line.slice(3))}\\b0\\fs22\\par`;
    if (line.startsWith("### ")) return `\\pard\\sa140\\fs23\\b ${rtfEscape(line.slice(4))}\\b0\\fs22\\par`;
    if (line.startsWith("- ")) return `\\pard\\li360\\fi-180\\tx360 \\bullet\\tab ${rtfEscape(line.slice(2))}\\par`;
    if (line.startsWith("|")) return `\\pard\\f1\\fs18 ${rtfEscape(line)}\\f0\\fs22\\par`;
    const boldConverted = line.replace(/\*\*(.*?)\*\*/g, (_, value) => `\\b ${rtfEscape(value)}\\b0 `);
    return `\\pard\\sa80 ${boldConverted === line ? rtfEscape(line) : boldConverted}\\par`;
  }).join("\n");
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}{\\f1 Courier New;}}\\viewkind4\\uc1\\fs22\n${body}\n}`;
}

export function buildRtfReport(data) {
  return markdownToRtf(buildMarkdownReport(data));
}
