/**
 * PDF Export Engine
 *
 * Generates professional PDF reports using @react-pdf/renderer.
 * Includes estimator results, timeline, and phase breakdown.
 */

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { EstimatorResults } from "@/lib/estimator/types";

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2px solid #1890ff",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1890ff",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
  },
  section: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    borderBottom: "1px solid #e0e0e0",
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    paddingHorizontal: 5,
    fontWeight: "bold",
  },
  cell: {
    flex: 1,
  },
  cellRight: {
    flex: 1,
    textAlign: "right",
  },
  summaryBox: {
    backgroundColor: "#f0f7ff",
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1890ff",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#999",
  },
});

interface PDFReportProps {
  results: EstimatorResults;
  profileName: string;
  generatedAt: Date;
}

// PDF Document Component
const EstimatorPDFReport = ({ results, profileName, generatedAt }: PDFReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SAP S/4HANA Project Estimate</Text>
        <Text style={styles.subtitle}>
          Generated: {generatedAt.toLocaleDateString()} | Profile: {profileName}
        </Text>
      </View>

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Effort</Text>
            <Text style={styles.summaryValue}>{results.totalMD.toFixed(0)} MD</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{results.durationMonths.toFixed(1)} months</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>PMO Effort</Text>
            <Text style={styles.summaryValue}>{results.pmoMD.toFixed(0)} MD</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly Capacity</Text>
            <Text style={styles.summaryValue}>{results.capacityPerMonth.toFixed(1)} MD/month</Text>
          </View>
        </View>
      </View>

      {/* Coefficients */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Complexity Coefficients</Text>
        <View style={styles.row}>
          <Text style={styles.cell}>Scope Breadth (Sb)</Text>
          <Text style={styles.cellRight}>{results.coefficients.Sb.toFixed(3)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell}>Process Complexity (Pc)</Text>
          <Text style={styles.cellRight}>{results.coefficients.Pc.toFixed(3)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell}>Organizational Scale (Os)</Text>
          <Text style={styles.cellRight}>{results.coefficients.Os.toFixed(3)}</Text>
        </View>
      </View>

      {/* Phase Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SAP Activate Phase Breakdown</Text>
        <View style={styles.headerRow}>
          <Text style={styles.cell}>Phase</Text>
          <Text style={styles.cellRight}>Effort (MD)</Text>
          <Text style={styles.cellRight}>Duration (mo)</Text>
          <Text style={styles.cellRight}>% of Total</Text>
        </View>
        {results.phases.map((phase, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.cell}>{phase.phaseName}</Text>
            <Text style={styles.cellRight}>{phase.effortMD.toFixed(1)}</Text>
            <Text style={styles.cellRight}>{phase.durationMonths.toFixed(1)}</Text>
            <Text style={styles.cellRight}>
              {((phase.effortMD / results.totalMD) * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Generated by Keystone | Confidential</Text>
    </Page>
  </Document>
);

/**
 * Generate and download PDF report
 */
export async function generatePDFReport(
  results: EstimatorResults,
  profileName: string
): Promise<Blob> {
  const doc = (
    <EstimatorPDFReport results={results} profileName={profileName} generatedAt={new Date()} />
  );
  const asPdf = pdf(doc);
  const blob = await asPdf.toBlob();
  return blob;
}

/**
 * Trigger PDF download in browser
 */
export async function downloadPDFReport(
  results: EstimatorResults,
  profileName: string,
  filename: string = "sap-estimate.pdf"
): Promise<void> {
  const blob = await generatePDFReport(results, profileName);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
