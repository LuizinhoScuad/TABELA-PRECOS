/**
 * Sistema de Cálculo de Custos - Versão Corrigida (M.O. e Parser)
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#cost-form");
  const resetButton = document.querySelector("#reset-form");

  if (!form) {
    console.error("Formulário não encontrado!");
    return;
  }

  const outputs = {
    heroUnitPrice: document.querySelector("#hero-unit-price"),
    unitPrice: document.querySelector("#unit-price"),
    paperCost: document.querySelector("#paper-cost"),
    printingCost: document.querySelector("#printing-cost"),
    plastificationCost: document.querySelector("#plastification-cost"),
    setupCost: document.querySelector("#setup-cost"),
    suppliesCost: document.querySelector("#supplies-cost"),
    laborCost: document.querySelector("#labor-cost"),
    diecutCost: document.querySelector("#diecut-cost"),
    totalCost: document.querySelector("#total-cost")
  };

  /**
   * Formata valores para R$ pt-BR
   */
  function formatMoney(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(Number(value || 0));
  }

  /**
   * Parser Robusto para Números (Brasileiro e Internacional)
   */
  function safeParseNumber(value, fallback = 0) {
    if (typeof value === "number") return isFinite(value) ? value : fallback;
    if (!value || typeof value !== "string") return fallback;

    // Limpeza profunda
    let clean = value.replace(/R\$/g, "").replace(/\s/g, "").trim();

    // Decisão inteligente de separadores
    const hasComma = clean.includes(",");
    const hasDot = clean.includes(".");

    if (hasComma && hasDot) {
      // Formato BR: 1.000,00 ou US: 1,000.00
      if (clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
        // BR
        clean = clean.replace(/\./g, "").replace(",", ".");
      } else {
        // US
        clean = clean.replace(/,/g, "");
      }
    } else if (hasComma) {
      // Apenas vírgula: assumimos decimal BR
      clean = clean.replace(",", ".");
    } else if (hasDot) {
      // Apenas ponto: 
      // Se tiver exatamente 3 dígitos depois do ponto, PODE ser milhar.
      // Mas para gramatura (250), produtividade (1000) ou kilo (12.55), 
      // é mais provável que o ponto seja decimal se não houver mais de um.
      const parts = clean.split(".");
      if (parts.length === 2 && parts[1].length !== 3) {
        // Provavelmente decimal
      } else if (parts.length > 2) {
        // Milhares
        clean = clean.replace(/\./g, "");
      }
      // Na dúvida em campos de produtividade, mantemos o ponto se for único.
      // Para o sistema Luizinho, vamos assumir que se não tem vírgula, o ponto é milhar apenas se houver mais de um.
    }

    const parsed = parseFloat(clean);
    return isFinite(parsed) ? parsed : fallback;
  }

  function parsePaperFormat(input) {
    const match = String(input || "").replace(",", ".").match(/(\d+(\.\d+)?)\s*x\s*(\d+(\.\d+)?)/i);
    return match ? { width: Number(match[1]), height: Number(match[3]) } : { width: 66, height: 96 };
  }

  function readForm() {
    const fd = new FormData(form);

    return {
      boxesPerSheet: safeParseNumber(fd.get("boxesPerSheet"), 1),
      grammage: safeParseNumber(fd.get("grammage"), 250),
      paperFormat: (fd.get("paperFormat") || "66 X 96").trim(),
      lidPerDay: safeParseNumber(fd.get("lidPerDay"), 0),
      boxPerDay: safeParseNumber(fd.get("boxPerDay"), 0),
      paperKgCost: safeParseNumber(fd.get("paperKgCost"), 0),
      profitMargin: safeParseNumber(fd.get("profitMargin"), 0),

      setupLossPercent: safeParseNumber(fd.get("setupLossPercent"), 10),
      unitSuppliesCost: safeParseNumber(fd.get("unitSuppliesCost"), 0),
      unitPrintingCost: safeParseNumber(fd.get("unitPrintingCost"), 0),
      plastM2Cost: safeParseNumber(fd.get("plastM2Cost"), 0.36),
      diecutSetupCost: safeParseNumber(fd.get("diecutSetupCost"), 0.15),
      operatorSalary: safeParseNumber(fd.get("operatorSalary"), 3300),
      workingDays: safeParseNumber(fd.get("workingDays"), 22),

      zeroPrinting: form.elements.zeroPrinting.checked,
      plastification: form.elements.plastification.checked,
      zeroSetup: form.elements.zeroSetup.checked,
      zeroSupplies: form.elements.zeroSupplies.checked,
      assemblyPrice: form.elements.assemblyPrice.checked
    };
  }

  function calculateCosts(input) {
    const paperMeasures = parsePaperFormat(input.paperFormat);

    // 1. Papel
    const paperSheetAreaM2 = (paperMeasures.width * paperMeasures.height) / 10000;
    const paperKgPerSheet = (paperSheetAreaM2 * input.grammage) / 1000;
    const paperCost = paperKgPerSheet * input.paperKgCost;

    // 2. Impressão
    const printingCost = input.zeroPrinting ? 0 : input.unitPrintingCost;

    // 3. Plastificação
    const plastificationCost = input.plastification ? (paperSheetAreaM2 * input.plastM2Cost) : 0;

    // 4. Setup
    const setupCost = input.zeroSetup ? 0 : (paperCost * (input.setupLossPercent / 100));

    // 5. Insumos Fixos
    const suppliesCost = input.zeroSupplies ? 0 : input.unitSuppliesCost;

    // 6. Mão de Obra (M.O.) - A REGRAS FINAL
    let laborCost = 0;
    if (input.assemblyPrice) {
      const dailyCost = input.workingDays > 0 ? input.operatorSalary / input.workingDays : 0;

      // Salário dia / Produção dia = Custo unitário por peça
      const costPerLid = input.lidPerDay > 0 ? dailyCost / input.lidPerDay : 0;
      const costPerBox = input.boxPerDay > 0 ? dailyCost / input.boxPerDay : 0;

      laborCost = costPerLid + costPerBox;
    }

    // 7. Corte e Vinco
    const diecutCost = input.zeroSetup ? 0 : input.diecutSetupCost;

    // SOMAS
    const totalCost = paperCost + printingCost + plastificationCost + setupCost + suppliesCost + laborCost + diecutCost;
    const accumulatedPrice = totalCost * (1 + (input.profitMargin / 100));
    const unitPrice = input.boxesPerSheet > 0 ? accumulatedPrice / input.boxesPerSheet : accumulatedPrice;

    return {
      paperCost, printingCost, plastificationCost, setupCost,
      suppliesCost, laborCost, diecutCost, totalCost, unitPrice
    };
  }

  function render(values) {
    if (outputs.heroUnitPrice) outputs.heroUnitPrice.textContent = formatMoney(values.unitPrice);
    if (outputs.unitPrice) outputs.unitPrice.textContent = formatMoney(values.unitPrice);
    if (outputs.paperCost) outputs.paperCost.textContent = formatMoney(values.paperCost);
    if (outputs.printingCost) outputs.printingCost.textContent = formatMoney(values.printingCost);
    if (outputs.plastificationCost) outputs.plastificationCost.textContent = formatMoney(values.plastificationCost);
    if (outputs.setupCost) outputs.setupCost.textContent = formatMoney(values.setupCost);
    if (outputs.suppliesCost) outputs.suppliesCost.textContent = formatMoney(values.suppliesCost);
    if (outputs.laborCost) outputs.laborCost.textContent = formatMoney(values.laborCost);
    if (outputs.diecutCost) outputs.diecutCost.textContent = formatMoney(values.diecutCost);
    if (outputs.totalCost) outputs.totalCost.textContent = formatMoney(values.totalCost);
  }

  function update() {
    const input = readForm();
    const costs = calculateCosts(input);
    render(costs);
  }

  // Eventos de entrada
  form.addEventListener("input", update);
  form.addEventListener("change", update);

  // Formatação especial para Salário
  const salaryInput = form.elements.operatorSalary;
  if (salaryInput) {
    salaryInput.addEventListener("blur", (e) => {
      const val = safeParseNumber(e.target.value);
      e.target.value = formatMoney(val);
      update();
    });
    salaryInput.addEventListener("focus", (e) => {
      const val = safeParseNumber(e.target.value);
      e.target.value = val > 0 ? val.toString().replace(".", ",") : "";
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      setTimeout(() => {
        const todayField = form.elements.today;
        if (todayField) todayField.value = new Date().toISOString().slice(0, 10);
        update();
      }, 10);
    });
  }

  // Inicialização
  const todayField = form.elements.today;
  if (todayField) todayField.value = new Date().toISOString().slice(0, 10);
  update();
});
