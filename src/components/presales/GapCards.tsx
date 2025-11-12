"use client";

interface Gap {
  id: string;
  title: string;
  description: string;
  severity: "block" | "warn" | "info";
  category: "basic" | "decisions" | "technical";
  action?: string;
}

interface GapCardsProps {
  gaps: string[];
  onFixAction?: (gapId: string, action: string) => void;
  className?: string;
}

export default function GapCards({ gaps, onFixAction, className = "" }: GapCardsProps) {
  // Convert string gaps to structured gaps
  const structuredGaps: Gap[] = gaps.map((gapText, index) => {
    let severity: "block" | "warn" | "info" = "info";
    let category: "basic" | "decisions" | "technical" = "basic";
    let title = gapText;
    let description = "";
    let action = "add";

    // Parse gap text
    if (gapText.includes("country") || gapText.includes("region")) {
      severity = "block";
      category = "basic";
      title = "Country/Region";
      description = "Specify implementation country (e.g., Malaysia, Singapore, Thailand)";
      action = "add_country";
    } else if (gapText.includes("employee")) {
      severity = "warn";
      category = "basic";
      title = "Employee Count";
      description = "Add number of employees or users (e.g., 500 employees, 32 users)";
      action = "add_employees";
    } else if (gapText.includes("module")) {
      severity = "block";
      category = "decisions";
      title = "SAP Modules";
      description = "Select required modules (Finance, HR, Supply Chain, etc.)";
      action = "add_modules";
    } else if (gapText.includes("timeline") || gapText.includes("go-live")) {
      severity = "block";
      category = "decisions";
      title = "Timeline";
      description = "Set target go-live date (e.g., Q2 2024, June 2024)";
      action = "add_timeline";
    } else if (gapText.includes("industry")) {
      severity = "warn";
      category = "basic";
      title = "Industry";
      description = "Specify industry sector (Manufacturing, Banking, Healthcare, etc.)";
      action = "add_industry";
    } else if (gapText.includes("revenue")) {
      severity = "warn";
      category = "basic";
      title = "Annual Revenue";
      description = "Add annual revenue (e.g., MYR 200M, SGD 50M)";
      action = "add_revenue";
    } else if (gapText.includes("integration")) {
      severity = "info";
      category = "technical";
      title = "Integration Requirements";
      description = "List systems to integrate (Salesforce, Oracle, etc.)";
      action = "add_integration";
    } else if (gapText.includes("compliance")) {
      severity = "info";
      category = "technical";
      title = "Compliance Requirements";
      description = "Add compliance needs (e-Invoice, LHDN, SST)";
      action = "add_compliance";
    }

    return {
      id: `gap_${index}`,
      title,
      description: description || gapText,
      severity,
      category,
      action,
    };
  });

  // Group gaps by category
  const gapsByCategory = structuredGaps.reduce(
    (acc, gap) => {
      if (!acc[gap.category]) acc[gap.category] = [];
      acc[gap.category].push(gap);
      return acc;
    },
    {} as Record<string, Gap[]>
  );

  const categoryLabels = {
    basic: "Basic Information",
    decisions: "Key Decisions",
    technical: "Technical Details",
  };

  const severityStyles = {
    block: {
      container: "border-red-200 bg-red-50",
      icon: "",
      text: "text-red-800",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
    warn: {
      container: "border-amber-200 bg-amber-50",
      icon: "",
      text: "text-amber-800",
      button: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    info: {
      container: "border-blue-200 bg-blue-50",
      icon: "ℹ️",
      text: "text-blue-800",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  };

  const handleAddClick = (gap: Gap) => {
    // Create example text based on gap type
    const exampleTexts: Record<string, string> = {
      add_country: "Malaysia",
      add_employees: "500 employees",
      add_modules: "Finance, HR, Supply Chain",
      add_timeline: "Q2 2024",
      add_industry: "Manufacturing",
      add_revenue: "MYR 200M annual revenue",
      add_integration: "Integrate with Salesforce CRM",
      add_compliance: "e-Invoice compliance required",
    };

    // Add example text to input field
    const inputField = document.querySelector("textarea") as HTMLTextAreaElement;
    if (inputField) {
      const currentText = inputField.value;
      const exampleText = exampleTexts[gap.action || ""] || gap.description;
      inputField.value = currentText ? `${currentText}\n${exampleText}` : exampleText;
      inputField.focus();

      // Trigger React's onChange event
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;
      nativeInputValueSetter?.call(inputField, inputField.value);
      const event = new Event("input", { bubbles: true });
      inputField.dispatchEvent(event);
    }

    // Also call the onFixAction callback
    if (onFixAction) {
      onFixAction(gap.id, gap.action || "add");
    }
  };

  if (!gaps || gaps.length === 0) {
    return (
      <div className={`p-4 border border-green-200 bg-green-50 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-green-600"></span>
          <div>
            <div className="font-medium text-green-800">All requirements captured</div>
            <div className="text-sm text-green-600">Ready to proceed with planning</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Missing Requirements</h4>
        <span className="text-sm text-gray-500">
          {gaps.length} item{gaps.length !== 1 ? "s" : ""}
        </span>
      </div>

      {Object.entries(gapsByCategory).map(([category, categoryGaps]) => (
        <div key={category} className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            {categoryLabels[category as keyof typeof categoryLabels]}
          </h5>

          {categoryGaps.map((gap) => {
            const styles = severityStyles[gap.severity];
            return (
              <div key={gap.id} className={`border rounded-lg p-3 ${styles.container}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{styles.icon}</span>
                      <span className={`font-medium ${styles.text}`}>{gap.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{gap.description}</p>
                  </div>

                  <button
                    onClick={() => handleAddClick(gap)}
                    className={`ml-4 px-3 py-1 text-sm rounded-md transition-colors ${styles.button}`}
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
