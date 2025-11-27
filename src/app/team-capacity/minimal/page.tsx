"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MinimalPage() {
  const [data] = useState(`# TEAM CAPACITY (MINIMAL MODE)
# Press TAB to navigate, ENTER to edit
# Format: NAME,ROLE,W1,W2,W3,W4,W5,W6,W7,W8

Sarah Chen,Director,2,2,2,2,5,5,5,5
Michael Ross,PM,5,5,5,5,5,5,5,5
Anna Schmidt,FI,0,0,3,3,5,5,5,5
David Kim,MM,0,0,0,0,4,4,4,4
Elena Popov,SD,0,0,0,0,0,3,3,3
James Lee,ABAP,0,0,0,0,0,0,4,4
Maria Garcia,Basis,0,0,0,0,0,0,0,5
Tom Wilson,QA,0,0,0,0,0,0,0,0

# STATS
Total: 36 members allocated
Utilization: 67%
Cost: EUR 1.2M

# COMMANDS
:export    Export to CSV
:import    Import from CSV
:help      Show keyboard shortcuts
:q         Return to options`);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#00FF00',
      fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Fira Mono", "Droid Sans Mono", monospace',
      fontSize: '14px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px',
      }}>
        <Link
          href="/team-capacity/options"
          style={{
            display: 'inline-block',
            color: '#00FF00',
            textDecoration: 'none',
            marginBottom: '24px',
            fontSize: '13px',
          }}
        >
          &lt;- BACK TO OPTIONS
        </Link>

        <div style={{
          border: '1px solid #00FF00',
          padding: '20px',
          backgroundColor: '#0A0A0A',
        }}>
          <pre style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            lineHeight: '1.8',
          }}>
            {data}
          </pre>
        </div>

        <div style={{
          marginTop: '16px',
          fontSize: '12px',
          color: '#00AA00',
        }}>
          [BRUTALIST MODE] Keyboard-first • Zero distraction • Maximum speed
        </div>
      </div>
    </div>
  );
}
