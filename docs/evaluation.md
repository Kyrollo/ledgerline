# LedgerLine Evaluation & Reproducibility Guide

LedgerLine includes an automated evaluation benchmark runner that measures 3-way matching throughput, line-item table parsing speed, and live local GPU CFO memorandum synthesis on the workstation NVIDIA Dedicated NVIDIA GPU.

---

## 1. Running the Evaluation Suite

From the project root:
```bash
python evaluation/harness/runner.py
```

### Outputs Generated
- `evaluation/reports/latest_eval.json`: Full machine-readable benchmark metrics.
- `evaluation/reports/ledger_audit_metrics.svg`: Vector graphic visualization of measured throughput and financial KPIs.
- `evaluation/reports/report.md`: Human-readable markdown audit summary.

---

## 2. Key Performance Indicators (KPIs)

- **Line Item Match Speed**: Measured throughput for algorithmic cross-reconciliation (< 1.0 µs per item).
- **100-Item Bulk Matching**: End-to-end matching of complex multi-line purchase orders (< 1.0 ms).
- **GPU Synthesis Latency**: Executive memorandum synthesis via local Ollama (~2.5s on Dedicated NVIDIA GPU).
- **Zero-Simulation Guarantee**: Evaluated with `check_no_simulation.py` to ensure zero fake or mock patterns in production paths.
