import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { RelatorioProducao, RelatorioEncaminhamentos } from '@/services/relatoriosService'

const AZUL   = [11, 58, 111]  as [number, number, number]
const VERDE  = [47, 158, 110] as [number, number, number]
const VERMELHO = [200, 54, 74] as [number, number, number]
const CINZA  = [108, 119, 136] as [number, number, number]
const PAPEL  = [245, 241, 235] as [number, number, number]

function cabecalhoPDF(doc: jsPDF, titulo: string, subtitulo: string) {
  // Faixa azul no topo
  doc.setFillColor(...AZUL)
  doc.rect(0, 0, 210, 28, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('ACS Expert', 14, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(200, 220, 245)
  doc.text('Sistema de Acompanhamento Comunitário de Saúde', 14, 19)

  // Título do relatório
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text(titulo, 210 - 14, 12, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 220, 245)
  doc.text(subtitulo, 210 - 14, 19, { align: 'right' })

  // Linha divisória
  doc.setDrawColor(...AZUL)
  doc.setLineWidth(0.3)
  doc.line(14, 32, 196, 32)

  return 36 // y inicial para o conteúdo
}

function rodapePDF(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...CINZA)
    doc.text(
      `ACS Expert · Gerado em ${new Date().toLocaleDateString('pt-BR')} · Página ${i} de ${pageCount}`,
      105, 290, { align: 'center' }
    )
  }
}

function fmtData(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── PRODUÇÃO DOS ACS ──────────────────────────────────────────
export async function exportarProducaoPDF(
  dados: RelatorioProducao,
  periodo: { de: string; ate: string }
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const sub = `Período: ${fmtData(periodo.de)} a ${fmtData(periodo.ate)}`
  let y = cabecalhoPDF(doc, 'Produção dos ACS', sub)

  // Cards de totais
  const totais = [
    { label: 'Triagens',        value: dados.totais.total_triagens,             cor: AZUL },
    { label: 'Encaminhamentos', value: dados.totais.total_encaminhamentos,      cor: [58, 70, 86] as [number,number,number] },
    { label: 'Realizados',      value: dados.totais.encaminhamentos_realizados, cor: VERDE },
    { label: 'Vencidos',        value: dados.totais.encaminhamentos_vencidos,   cor: VERMELHO },
  ]
  const cardW = 60, cardH = 18, gap = 5
  const startX = 14
  totais.forEach(({ label, value, cor }, i) => {
    const x = startX + i * (cardW + gap)
    doc.setFillColor(...PAPEL)
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...cor)
    doc.text(String(value), x + cardW / 2, y + 11, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...CINZA)
    doc.text(label.toUpperCase(), x + cardW / 2, y + 16, { align: 'center' })
  })
  y += cardH + 8

  // Tabela
  autoTable(doc, {
    startY: y,
    head: [['ACS', 'Microárea', 'Triagens', 'Encaminhamentos', 'Realizados', 'Vencidos', 'Alto risco', 'Moderado', 'Baixo']],
    body: dados.acs.map((a) => [
      a.acs_nome,
      a.microarea ?? '—',
      a.total_triagens,
      a.total_encaminhamentos,
      a.encaminhamentos_realizados,
      a.encaminhamentos_vencidos,
      a.pacientes_alto_risco,
      a.pacientes_moderado_risco,
      a.pacientes_baixo_risco,
    ]),
    headStyles: {
      fillColor: AZUL,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [14, 23, 38] },
    alternateRowStyles: { fillColor: PAPEL },
    columnStyles: {
      2: { halign: 'right' }, 3: { halign: 'right' },
      4: { halign: 'right' }, 5: { halign: 'right' },
      6: { halign: 'right' }, 7: { halign: 'right' },
      8: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  rodapePDF(doc)
  doc.save(`relatorio-producao-acs_${periodo.de}_${periodo.ate}.pdf`)
}

// ── ENCAMINHAMENTOS ───────────────────────────────────────────
export async function exportarEncaminhamentosPDF(
  dados: RelatorioEncaminhamentos,
  periodo: { de: string; ate: string }
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const sub = `Período: ${fmtData(periodo.de)} a ${fmtData(periodo.ate)} · ${dados.total} registro${dados.total !== 1 ? 's' : ''}`
  let y = cabecalhoPDF(doc, 'Encaminhamentos', sub)

  // Resumo por status
  const statusOrder = ['pendente', 'realizado', 'ausencia', 'cancelado']
  const statusLabel: Record<string, string> = {
    pendente: 'Pendentes', realizado: 'Realizados', ausencia: 'Ausência', cancelado: 'Cancelados',
  }
  const statusCor: Record<string, [number,number,number]> = {
    pendente: [242, 177, 52], realizado: VERDE, ausencia: VERMELHO, cancelado: CINZA,
  }
  const cardW = 58, cardH = 16, gap = 5
  statusOrder.forEach((s, i) => {
    const x = 14 + i * (cardW + gap)
    const cor = statusCor[s]
    doc.setFillColor(...PAPEL)
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...cor)
    doc.text(String(dados.resumo[s] ?? 0), x + cardW / 2, y + 10, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...CINZA)
    doc.text((statusLabel[s] ?? s).toUpperCase(), x + cardW / 2, y + 14.5, { align: 'center' })
  })
  y += cardH + 8

  const TIPO_LABEL: Record<string, string> = {
    consulta_medica: 'Consulta médica', enfermagem: 'Enfermagem',
    vacinacao: 'Vacinação', exame: 'Exame', urgencia: 'Urgência', especialista: 'Especialista',
  }
  const STATUS_LABEL: Record<string, string> = {
    pendente: 'Pendente', realizado: 'Realizado', ausencia: 'Ausência', cancelado: 'Cancelado',
  }

  autoTable(doc, {
    startY: y,
    head: [['Paciente', 'ACS', 'Microárea', 'Tipo', 'Data prevista', 'Status', 'Desfecho']],
    body: dados.encaminhamentos.map((e) => {
      const vencido = e.status === 'pendente' && e.dias_atraso != null && e.dias_atraso > 0
      return [
        e.paciente_nome,
        e.acs_nome,
        e.microarea ?? '—',
        TIPO_LABEL[e.tipo] ?? e.tipo,
        fmtData(e.data_prevista) + (vencido ? ` (+${e.dias_atraso}d)` : ''),
        vencido ? 'Vencido' : (STATUS_LABEL[e.status] ?? e.status),
        fmtData(e.data_desfecho),
      ]
    }),
    headStyles: {
      fillColor: AZUL,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [14, 23, 38] },
    alternateRowStyles: { fillColor: PAPEL },
    didParseCell(data) {
      // Colorir status vencido de vermelho
      if (data.section === 'body' && data.column.index === 5) {
        const v = String(data.cell.raw)
        if (v === 'Vencido') data.cell.styles.textColor = VERMELHO
        if (v === 'Realizado') data.cell.styles.textColor = VERDE
      }
    },
    margin: { left: 14, right: 14 },
  })

  rodapePDF(doc)
  doc.save(`relatorio-encaminhamentos_${periodo.de}_${periodo.ate}.pdf`)
}
